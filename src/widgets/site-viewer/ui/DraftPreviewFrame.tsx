'use client';

import { type MouseEvent, type ReactNode, useEffect, useRef, useState } from 'react';

import { NumberedPin } from '@/entities/pin';
import type { ApiError } from '@/shared/api';
import { createAnchor, findElementAtPoint, restoreAnchor } from '@/shared/lib/pin-engine';

import type { PinPosition, ViewerMode, ViewerPin } from '../model/types';
import PinMarkerLayer from './PinMarkerLayer';

/** 초안은 `#앵커` 링크만 있는 한 페이지 HTML이라 핀을 모두 `/`에 둡니다. */
export const DRAFT_PAGE_PATH = '/';

// `100vh` 레이아웃 등으로 높이가 비정상적으로 커지는 경우를 막는 상한
const MAX_FRAME_HEIGHT = 20_000;

interface FrameLayout {
  doc: Document;
  width: number;
  height: number;
}

/**
 * iframe 높이를 문서 높이에 맞춥니다. 스크롤은 부모 컨테이너가 합니다.
 * 높이를 0으로 줄였다가 재야 화면이 넓어져 짧아진 문서도 맞출 수 있습니다.
 */
const fitFrame = (iframe: HTMLIFrameElement, container: HTMLElement): FrameLayout | null => {
  const doc = iframe.contentDocument;
  // 로드 전에는 빈 about:blank 문서입니다.
  if (!doc || doc.URL !== 'about:srcdoc' || !doc.documentElement) return null;

  const { scrollTop } = container;
  iframe.style.height = '0px';
  const height = Math.min(
    MAX_FRAME_HEIGHT,
    Math.max(doc.documentElement.scrollHeight, doc.body?.scrollHeight ?? 0),
  );
  iframe.style.height = `${height}px`;
  container.scrollTop = scrollTop;
  return { doc, width: iframe.clientWidth, height };
};

/**
 * srcdoc 문서의 `#id` 링크는 부모 페이지 주소 기준으로 해석돼서 누르면 iframe이 우리 앱으로 이동합니다.
 * 부모에서 막고 해당 요소 위치로 부모 컨테이너를 스크롤합니다. 다른 링크는 이동만 막습니다.
 */
const handleLinkClick = (event: Event, iframe: HTMLIFrameElement, container: HTMLElement) => {
  // iframe 문서의 요소라 `instanceof Element`로 확인할 수 없습니다.
  const target = event.target as Element | null;
  const link = typeof target?.closest === 'function' ? target.closest('a[href]') : null;
  if (!link) return;
  event.preventDefault();

  const href = link.getAttribute('href') ?? '';
  if (!href.startsWith('#')) return;
  let id = href.slice(1);
  try {
    id = decodeURIComponent(id);
  } catch {
    // 잘못된 인코딩이면 원문 그대로 찾습니다.
  }
  const section = id ? link.ownerDocument.getElementById(id) : null;
  // iframe은 문서 높이만큼 커서 내부 스크롤이 없으므로 요소의 client 좌표가 문서 좌표입니다.
  const top = section ? section.getBoundingClientRect().top : 0;
  container.scrollTo({ top: iframe.offsetTop + top, behavior: 'smooth' });
};

/**
 * 마커를 그릴 문서 좌표(px)와 복원 결과.
 * `missing`이면 위치 확인 필요로 흐리게 그리고, `hidden`(모달, 탭 등)이면 그리지 않습니다.
 */
type PinLocation =
  | { status: 'found' | 'missing'; x: number; y: number }
  | { status: 'hidden'; x?: undefined; y?: undefined };

const locatePin = (layout: FrameLayout, pin: ViewerPin): PinLocation => {
  const saved = { x: (pin.x / 100) * layout.width, y: (pin.y / 100) * layout.height };
  if (!pin.anchor) return { status: 'found', ...saved };
  const result = restoreAnchor(layout.doc, pin.anchor);
  if (result.status === 'found') {
    return { status: 'found', x: result.position.pageX, y: result.position.pageY };
  }
  if (result.status === 'hidden') return { status: 'hidden' };
  // 요소를 못 찾으면 핀을 찍을 때 저장한 문서 좌표(없으면 저장된 상대 좌표)로 대신 그립니다.
  const { fallback } = result;
  return { status: 'missing', ...(fallback ? { x: fallback.pageX, y: fallback.pageY } : saved) };
};

const toErrorMessage = (error: ApiError) =>
  error.code === 'DRAFT_NOT_FOUND'
    ? '초안이 새로 만들어졌어요. 새로고침해 주세요.'
    : '초안 미리보기를 불러오지 못했어요.';

interface DraftPreviewFrameProps {
  /** 라우트 핸들러가 CSP `<meta>`를 넣은 초안 HTML. 받는 중이면 `undefined` */
  html: string | undefined;
  error?: ApiError | null;
  mode: ViewerMode;
  pins: ViewerPin[];
  onPlacePin?: (position: PinPosition) => void;
  onSelectPin?: (pinId: string) => void;
  /** 강조할 핀 */
  selectedPinId?: string | null;
  /** 저장 전인 새 핀 위치(문서 기준 %)와, 그 옆에 띄울 입력창 */
  draftPin?: PinPosition | null;
  draftPinContent?: ReactNode;
  /** 핀 요소가 초안에 없을 때(`needs_check` 보고용). 숨겨진 요소에는 부르지 않습니다. */
  onPinMissing?: (pinId: string) => void;
  /** 핀 요소를 찾았을 때(`located` 보고용) */
  onPinFound?: (pinId: string) => void;
}

/**
 * AI 초안을 같은 출처 `srcdoc` iframe으로 띄우고, 부모가 문서를 직접 읽어 핀 위치를 계산합니다.
 * `sandbox`에 `allow-scripts`, `allow-forms`를 절대 넣지 않습니다. 같은 출처라서 스크립트가 돌면
 * 워크스페이스가 위험해집니다.
 */
const DraftPreviewFrame = ({
  html,
  error,
  mode,
  pins,
  onPlacePin,
  onSelectPin,
  selectedPinId,
  draftPin,
  draftPinContent,
  onPinMissing,
  onPinFound,
}: DraftPreviewFrameProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [layout, setLayout] = useState<FrameLayout | null>(null);

  // 화면 너비(기기 전환, 창 크기, 채팅 패널)가 바뀌면 높이와 핀 위치를 다시 계산합니다.
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      const iframe = iframeRef.current;
      const next = iframe && fitFrame(iframe, container);
      if (next) setLayout(next);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    const iframe = iframeRef.current;
    const container = scrollRef.current;
    if (!iframe || !container) return;
    const next = fitFrame(iframe, container);
    if (!next) return;
    next.doc.addEventListener('click', (event) => handleLinkClick(event, iframe, container));
    setLayout(next);
  };

  // 투명 레이어를 누른 위치 아래의 초안 요소를 찾아 요소 기준 앵커를 만듭니다.
  const handlePlacePin = (event: MouseEvent<HTMLButtonElement>) => {
    const iframe = iframeRef.current;
    const doc = layout?.doc;
    if (!iframe || !doc) return;
    const rect = iframe.getBoundingClientRect();
    const clientX = event.clientX - rect.left;
    const clientY = event.clientY - rect.top;
    const element = findElementAtPoint(doc, clientX, clientY) ?? doc.body ?? doc.documentElement;
    onPlacePin?.({
      x: (clientX / rect.width) * 100,
      y: (clientY / rect.height) * 100,
      anchor: createAnchor({ element, clientX, clientY, pagePath: DRAFT_PAGE_PATH }),
    });
  };

  const located = layout ? pins.map((pin) => ({ pin, ...locatePin(layout, pin) })) : [];
  const hiddenPins = located.flatMap(({ pin, status }) => (status === 'hidden' ? [pin] : []));
  // 마커 레이어는 iframe과 같은 크기라서 문서 좌표(px)를 %로 바꿔 넘깁니다.
  const markers =
    layout?.width && layout.height
      ? located.flatMap((item) =>
          item.status === 'hidden'
            ? []
            : [
                {
                  pin: item.pin,
                  x: (item.x / layout.width) * 100,
                  y: (item.y / layout.height) * 100,
                  needsCheck: item.status === 'missing',
                },
              ],
        )
      : [];

  // 요소 기준으로 찾은 결과만 보고합니다. 보고 중복은 받는 쪽이 막습니다.
  const reportKey = located
    .flatMap(({ pin, status }) => (pin.anchor ? [`${pin.id}:${status}`] : []))
    .join(',');
  useEffect(() => {
    // 초안이 바뀌어 iframe이 다시 로드되는 중이면 예전 문서 결과라 보고하지 않습니다.
    if (!reportKey || layout?.doc !== iframeRef.current?.contentDocument) return;
    for (const entry of reportKey.split(',')) {
      const [pinId, status] = entry.split(':');
      if (status === 'missing') onPinMissing?.(pinId);
      if (status === 'found') onPinFound?.(pinId);
    }
  }, [reportKey, layout, onPinMissing, onPinFound]);

  const status = error
    ? toErrorMessage(error)
    : html === undefined
      ? '초안 미리보기를 불러오고 있어요.'
      : null;

  return (
    <div ref={scrollRef} className="absolute inset-0 overflow-auto">
      {status ? (
        <p
          role={error ? 'alert' : 'status'}
          className="text-faint absolute inset-0 grid place-items-center px-6 text-center text-sm"
        >
          {status}
        </p>
      ) : (
        <div className="relative">
          <iframe
            ref={iframeRef}
            title="AI 초안 미리보기"
            srcDoc={html}
            sandbox="allow-same-origin"
            referrerPolicy="no-referrer"
            onLoad={handleLoad}
            className="block w-full border-0"
            style={layout ? { height: layout.height } : undefined}
          />
          {/* 핀 모드에서는 초안 쪽 클릭이 동작하지 않도록 위를 덮습니다. */}
          {mode === 'pin' && (
            <button
              type="button"
              aria-label="핀 추가할 위치 선택"
              onClick={handlePlacePin}
              className="absolute inset-0 cursor-crosshair"
            />
          )}
          <PinMarkerLayer
            markers={markers}
            selectedPinId={selectedPinId}
            onSelectPin={onSelectPin}
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
      )}
      {/* 숨겨진 요소(모달, 탭 등)의 핀은 보고하지 않고 안내만 합니다. 스크롤해도 아래에 붙어 있습니다. */}
      {hiddenPins.length > 0 && (
        <p
          role="status"
          className="text-muted sticky bottom-3 z-30 mr-3 ml-auto w-fit rounded-[10px] bg-white px-3 py-1.5 text-xs font-semibold shadow-[0_2px_12px_rgba(24,24,27,0.12)]"
        >
          {hiddenPins.map((pin) => pin.number).join(', ')}번 핀은 지금 화면에 없어요
        </p>
      )}
    </div>
  );
};

export default DraftPreviewFrame;
