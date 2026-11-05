'use client';

import { type ReactNode, useEffect, useEffectEvent, useRef, useState } from 'react';

import { NumberedPin } from '@/entities/pin';
import { CHANGE_REQUEST_STATUS_TONE } from '@/entities/request';
import {
  type BridgePin,
  type ParentMessage,
  parseSiteMessage,
  PIN_BRIDGE_VERSION,
  toOrigin,
} from '@/shared/lib/pin-bridge';

import type { PinPosition, PinScriptStatus, ViewerMode, ViewerPin } from '../model/types';

/**
 * 이 시간 안에 `respec:ready`가 오지 않으면 핀 스크립트가 없다고 봅니다.
 * 스크립트 없이는 핀 위치를 고정할 수 없어서 핀 모드를 막습니다(FE#80).
 */
export const PIN_SCRIPT_READY_TIMEOUT_MS = 2000;

const getInitialPath = (url: string) => {
  try {
    return new URL(url).pathname || '/';
  } catch {
    return '/';
  }
};

/** iframe으로 보낼 핀. 위치와 마커 표시에 필요한 값만 보내고, 요청 내용은 툴팁용 앞부분만 보냅니다. */
const toBridgePins = (pins: ViewerPin[], path: string): BridgePin[] =>
  pins.flatMap((pin) =>
    pin.pagePath === path && pin.anchor
      ? [
          {
            id: pin.id,
            number: pin.number,
            page_path: pin.pagePath,
            element_selector: pin.anchor.element_selector,
            relative_x: pin.anchor.relative_x,
            relative_y: pin.anchor.relative_y,
            location_context: pin.anchor.location_context ?? null,
            tone: pin.status ? CHANGE_REQUEST_STATUS_TONE[pin.status] : 'brand',
            muted: !!pin.muted,
            request_preview: pin.preview ?? null,
            location_status: pin.locationStatus ?? 'located',
          },
        ]
      : [],
  );

interface DeployedSiteFrameProps {
  /** 프로젝트 `deployment_url`. 이 주소의 origin에서 온 메시지만 받습니다. */
  url: string;
  mode: ViewerMode;
  /** 모든 경로의 핀. 지금 경로의 핀만 사이트로 보냅니다. */
  pins: ViewerPin[];
  /** 고른 핀. 다른 경로면 그 경로로 옮기고 핀으로 스크롤합니다. 같은 핀을 다시 고르면 `seq`가 바뀝니다. */
  focusPin?: { id: string; seq: number } | null;
  onPlacePin?: (position: PinPosition) => void;
  onSelectPin?: (pinId: string) => void;
  /** 사이트 DOM에 핀의 요소가 아예 없음. `needs_check` 보고는 호출부가 합니다. */
  onPinMissing?: (pinId: string) => void;
  /** 못 찾던 핀의 요소를 다시 찾음. `located` 보고는 호출부가 합니다. */
  onPinFound?: (pinId: string) => void;
  /** 지금 사이트의 경로가 바뀔 때 */
  onPathChange?: (path: string) => void;
  /** 핀 스크립트 연결 상태가 바뀔 때. 처음 마운트할 때 `connecting`으로 한 번 부릅니다. */
  onStatusChange?: (status: PinScriptStatus) => void;
  /** 저장 전인 새 핀 위치(iframe 화면 기준 %)와, 그 옆에 띄울 입력창 */
  draftPin?: PinPosition | null;
  draftPinContent?: ReactNode;
}

/**
 * 개발자가 연결한 배포 사이트를 cross-origin iframe으로 띄웁니다.
 * 사이트에 넣은 `respec-pin.js`가 마커를 그리고 앵커를 계산해 postMessage로 보냅니다.
 * 스크립트가 연결되지 않으면 핀을 그리지도 만들지도 않고, 호출부가 핀 모드를 막고 설치를 안내합니다.
 */
const DeployedSiteFrame = ({
  url,
  mode,
  pins,
  focusPin,
  onPlacePin,
  onSelectPin,
  onPinMissing,
  onPinFound,
  onPathChange,
  onStatusChange,
  draftPin,
  draftPinContent,
}: DeployedSiteFrameProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const origin = toOrigin(url);
  const [status, setStatus] = useState<PinScriptStatus>('connecting');
  const [path, setPath] = useState(() => getInitialPath(url));
  // 사이트가 새로 불러와질 때마다 올려서 모드와 핀을 다시 보냅니다.
  const [readyCount, setReadyCount] = useState(0);
  /** 다른 경로의 핀을 골랐을 때, 그 경로에 도착하면 스크롤할 핀 */
  const pendingFocusRef = useRef<{ id: string; path: string } | null>(null);

  const post = (message: ParentMessage) => {
    if (!origin) return;
    iframeRef.current?.contentWindow?.postMessage(message, origin);
  };

  const changePath = (next: string) => {
    setPath(next);
    onPathChange?.(next);
    const pending = pendingFocusRef.current;
    if (pending?.path === next) {
      pendingFocusRef.current = null;
      post({ type: 'respec:navigate', path: next, pinId: pending.id });
    }
  };

  const handleMessage = useEffectEvent((event: MessageEvent) => {
    // 프로젝트 배포 주소의 origin과 우리 iframe에서 온 메시지만 받습니다.
    if (!origin || event.origin !== origin) return;
    if (event.source !== iframeRef.current?.contentWindow) return;
    const message = parseSiteMessage(event.data);
    if (!message) return;

    switch (message.type) {
      case 'respec:ready':
        if (message.version !== PIN_BRIDGE_VERSION) {
          console.warn(`respec-pin.js 버전이 달라요: ${message.version}`);
        }
        setStatus('connected');
        setReadyCount((count) => count + 1);
        changePath(message.path);
        break;
      case 'respec:path-changed':
        changePath(message.path);
        break;
      case 'respec:pin-created':
        onPlacePin?.({ x: message.x, y: message.y, anchor: message.anchor });
        break;
      case 'respec:pin-clicked':
        onSelectPin?.(message.pinId);
        break;
      case 'respec:pin-missing':
        onPinMissing?.(message.pinId);
        break;
      case 'respec:pin-found':
        onPinFound?.(message.pinId);
        break;
    }
  });

  useEffect(() => {
    const listener = (event: MessageEvent) => handleMessage(event);
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, []);

  // iframe `onload`는 오류 화면에서도 발생하므로 판정에 쓰지 않고 `ready`만 기다립니다.
  useEffect(() => {
    const timer = setTimeout(
      () => setStatus((current) => (current === 'connecting' ? 'disconnected' : current)),
      PIN_SCRIPT_READY_TIMEOUT_MS,
    );
    return () => clearTimeout(timer);
  }, []);

  const notifyStatus = useEffectEvent((next: PinScriptStatus) => onStatusChange?.(next));
  useEffect(() => notifyStatus(status), [status]);

  const isConnected = status === 'connected';

  useEffect(() => {
    if (!isConnected || !origin) return;
    const message: ParentMessage = { type: 'respec:set-mode', mode };
    iframeRef.current?.contentWindow?.postMessage(message, origin);
  }, [isConnected, origin, mode, readyCount]);

  // 핀 목록은 주기적으로 다시 받으므로 내용이 바뀔 때만 보냅니다.
  const selectedPinId = focusPin?.id ?? null;
  const pinsMessage = JSON.stringify({
    type: 'respec:show-pins',
    pins: toBridgePins(pins, path),
    selectedPinId,
  } satisfies ParentMessage);

  useEffect(() => {
    if (!isConnected || !origin) return;
    iframeRef.current?.contentWindow?.postMessage(JSON.parse(pinsMessage), origin);
  }, [isConnected, origin, pinsMessage, readyCount]);

  const focusTarget = useEffectEvent((pinId: string) => {
    const pin = pins.find((item) => item.id === pinId);
    if (!pin || !isConnected) return;
    pendingFocusRef.current = pin.pagePath === path ? null : { id: pin.id, path: pin.pagePath };
    post({ type: 'respec:navigate', path: pin.pagePath, pinId: pin.id });
  });

  const focusId = focusPin?.id;
  const focusSeq = focusPin?.seq;
  useEffect(() => {
    if (focusId) focusTarget(focusId);
  }, [focusId, focusSeq]);

  return (
    <div className="absolute inset-0">
      <iframe
        ref={iframeRef}
        src={url}
        title="배포 사이트 미리보기"
        // 사이트가 워크스페이스(top)를 다른 주소로 옮기지 못하게 막습니다.
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads"
        className="block size-full border-0"
      />
      {draftPin && (
        <div
          className="absolute z-20 flex items-start gap-2"
          style={{ left: `${draftPin.x}%`, top: `${draftPin.y}%` }}
        >
          <span className="-translate-y-full">
            <NumberedPin number={Math.max(0, ...pins.map((pin) => pin.number)) + 1} draft />
          </span>
          {draftPinContent}
        </div>
      )}
    </div>
  );
};

export default DeployedSiteFrame;
