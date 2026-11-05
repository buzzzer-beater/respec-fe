'use client';

import { type MouseEvent, type ReactNode, useEffect, useEffectEvent, useState } from 'react';

import { NumberedPin } from '@/entities/pin';
import type { Device } from '@/features/switch-device';
import { cn } from '@/shared/lib';
import { Icon, toast } from '@/shared/ui';

import type {
  PinPosition,
  PinScriptStatus,
  SiteAddress,
  SiteHistoryControls,
  ViewerMode,
  ViewerPin,
} from '../model/types';
import { clampZoom } from '../model/zoom';
import BrowserBar from './BrowserBar';
import PinMarkerLayer from './PinMarkerLayer';
import ViewerToolbar from './ViewerToolbar';

const DEVICE_WIDTH: Record<Device, string> = {
  desktop: 'max-w-full',
  tablet: 'max-w-[820px]',
  mobile: 'max-w-[420px]',
};

const ROUND_BUTTON_CLASS =
  'text-text disabled:text-faint grid size-9 place-items-center rounded-full bg-white shadow-[0_1px_3px_rgba(24,24,27,0.08)] disabled:cursor-default disabled:shadow-none';

const DEFAULT_PIN_HINT = '바꾸고 싶은 곳을 눌러 주세요 · Esc로 나가기';

/**
 * 미리보기 위에 띄우는 안내(모드 안내, 핀 스크립트 안내)의 자리. 시안(`.note`)처럼 미리보기 영역 기준
 * 위에서 128px(사이트 화면 위쪽 바로 아래), 전체 화면에서는 16px입니다.
 */
const NOTE_PLACE_CLASS = 'pointer-events-none absolute left-1/2 z-[3] -translate-x-1/2';

/** 입력 중인 곳에서는 단축키 대신 글자를 씁니다. */
const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  !!target.closest('input, textarea, select, [contenteditable="true"]');

interface SiteViewerProps {
  url: string;
  pins: ViewerPin[];
  onPlacePin?: (position: PinPosition) => void;
  /** 저장 전인 새 핀 위치와, 그 옆에 띄울 입력창 */
  draftPin?: PinPosition | null;
  draftPinContent?: ReactNode;
  /** 새 핀에 붙일 번호. 없으면 `pins`의 가장 큰 번호 + 1입니다. */
  draftPinNumber?: number;
  onSelectPin?: (pinId: string) => void;
  /** 강조할 핀(채팅의 핀 카드를 눌렀을 때 등) */
  selectedPinId?: string | null;
  /** 사이트가 없을 때 보여 줄 안내(배포 연결 안내 등) */
  children?: ReactNode;
  /**
   * 사이트 영역을 직접 그립니다(초안 미리보기, 배포 사이트). 주면 투명 레이어, 핀 마커, 새 핀도
   * 그 안에서 그려야 해서 여기서는 그리지 않습니다. 사이트에서 핀을 찍으면 두 번째 인자로 받은
   * 함수를 부르세요(전체 화면이면 나간 뒤 `onPlacePin`을 부릅니다).
   */
  renderSite?: (mode: ViewerMode, onPlacePin: (position: PinPosition) => void) => ReactNode;
  /**
   * 핀을 찍을 수 없는 이유. 있으면 체험 모드로 두고, 핀 버튼이나 C를 눌렀을 때 이 문구를 아래 안내로 띄웁니다.
   * 핀 버튼은 막지 않습니다(시안).
   */
  pinBlockedMessage?: string | null;
  /** 사이트 화면 위쪽 가운데에 띄울 안내(핀 스크립트 설치 안내 등) */
  notice?: ReactNode;
  /** 틀 위쪽 주소창. 지금 보고 있는 페이지와 페이지 목록입니다. */
  address?: SiteAddress;
  /** 핀 스크립트 연결 상태. 주면 주소창 오른쪽에 점으로 보여 줍니다. 초안은 `connected`로 넘기세요. */
  scriptStatus?: PinScriptStatus;
  /** 사이트 안 이동 기록. 없으면 뒤로/앞으로 버튼을 누를 수 없게 둡니다. */
  history?: SiteHistoryControls;
  /** 있으면 틀 위쪽에 새로고침 버튼을 둡니다. */
  onReload?: () => void;
  /** 틀 아래 오른쪽 문구("초안 생성 · 3일 전" 등) */
  footnote?: ReactNode;
  /**
   * 사이트를 눌러 위치를 정하는 중일 때의 안내("핀 3의 반영 위치를 눌러 주세요 · Esc로 취소").
   * 있으면 핀 모드로 고정하고, Esc나 체험 모드로 바꾸면 `onCancelPlacing`을 부릅니다.
   */
  placingHint?: string | null;
  onCancelPlacing?: () => void;
  /** 모드를 밖에서 정할 때(패널의 "새 요청 남기기" 등). 없으면 안에서 관리하고 체험 모드로 시작합니다. */
  mode?: ViewerMode;
  onModeChange?: (mode: ViewerMode) => void;
  /**
   * Esc 순서(열린 대화상자 → 입력창 → 전체 화면 → 이것 → 체험 모드)에서 부모가 먼저 닫을 것(채팅 등).
   * 닫았으면 `true`를 돌려주세요. 그러면 체험 모드로 바꾸지 않습니다.
   */
  onEscape?: () => boolean;
  /** 전체 화면을 켜고 끌 때. 켜지면 채팅을 닫는 데 씁니다. */
  onFullscreenChange?: (isFull: boolean) => void;
  /** 해결된 핀 보기. `onShowResolvedChange`를 주면 틀 위쪽에 "완료 보기" 스위치를 둡니다. */
  showResolved?: boolean;
  onShowResolvedChange?: (value: boolean) => void;
}

/**
 * 사이트 미리보기를 브라우저 틀로 보여 줍니다(demo-design `.preview`).
 * 위: 뒤로/앞으로 · 주소창과 틀 도구 / 가운데: 사이트 / 아래: "초안 생성 · N일 전" · 도구 막대
 */
const SiteViewer = ({
  url,
  pins,
  onPlacePin,
  onSelectPin,
  selectedPinId,
  draftPin,
  draftPinContent,
  draftPinNumber,
  children,
  renderSite,
  pinBlockedMessage,
  notice,
  address,
  scriptStatus,
  history,
  onReload,
  footnote,
  placingHint,
  onCancelPlacing,
  mode: controlledMode,
  onModeChange,
  onEscape,
  onFullscreenChange,
  showResolved,
  onShowResolvedChange,
}: SiteViewerProps) => {
  const [innerMode, setInnerMode] = useState<ViewerMode>('browse');
  const chosenMode = controlledMode ?? innerMode;
  // 핀을 막으면 고른 모드와 상관없이 체험 모드이고, 위치를 정하는 중이면 핀 모드입니다.
  const isPinMode = !pinBlockedMessage && (!!placingHint || chosenMode === 'pin');
  const mode: ViewerMode = isPinMode ? 'pin' : 'browse';
  const ownsPinLayer = !renderSite;
  const [device, setDevice] = useState<Device>('desktop');
  const [isFull, setIsFull] = useState(false);
  const [zoom, setZoom] = useState(100);
  const scale = zoom / 100;

  // 핀 스크립트가 없다고 판정되는 등 핀이 막히면 핀 모드를 끕니다. 다시 열려도 저절로 켜지지 않습니다.
  const [prevBlocked, setPrevBlocked] = useState(pinBlockedMessage);
  if (pinBlockedMessage !== prevBlocked) {
    setPrevBlocked(pinBlockedMessage);
    if (pinBlockedMessage && innerMode === 'pin') setInnerMode('browse');
  }

  const changeMode = (next: ViewerMode) => {
    if (next === 'pin' && pinBlockedMessage) {
      toast(pinBlockedMessage);
      return;
    }
    if (next === 'browse' && placingHint) onCancelPlacing?.();
    setInnerMode(next);
    onModeChange?.(next);
  };

  // 사이트를 실제 화면 크기로 보도록 브라우저 전체 화면도 함께 켭니다. 막혀 있어도 화면 안 전체 화면은 됩니다.
  const changeFull = (next: boolean) => {
    setIsFull(next);
    onFullscreenChange?.(next);
    if (next && !document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
    if (!next && document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  };

  // 브라우저가 Esc 등으로 전체 화면을 끝내면 화면 안 전체 화면도 끝냅니다.
  const handleFullscreenChange = useEffectEvent(() => {
    if (!document.fullscreenElement && isFull) changeFull(false);
  });
  useEffect(() => {
    const listener = () => handleFullscreenChange();
    document.addEventListener('fullscreenchange', listener);
    return () => {
      document.removeEventListener('fullscreenchange', listener);
      // 다른 화면으로 옮길 때 브라우저 전체 화면이 남지 않게 합니다.
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, []);

  // 단축키: V 체험, C 핀 남기기, F 전체 화면.
  // Esc는 열린 대화상자 → 입력창 포커스 → 전체 화면 → 부모(`onEscape`) → 체험 모드 순서로 하나만 닫습니다.
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey || event.defaultPrevented) return;
    // 열린 대화상자(`<dialog>`)는 Esc를 스스로 처리하고, 그 안에서는 단축키를 쓰지 않습니다.
    if (document.querySelector('dialog[open]')) return;
    if (isTypingTarget(event.target)) {
      if (event.key === 'Escape') (event.target as HTMLElement).blur();
      return;
    }
    const key = event.key.toLowerCase();
    if (key === 'escape') {
      if (isFull) changeFull(false);
      else if (!onEscape?.()) changeMode('browse');
    } else if (key === 'v') changeMode('browse');
    else if (key === 'c') changeMode('pin');
    else if (key === 'f') changeFull(!isFull);
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => handleKeyDown(event);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  // 전체 화면에서 핀을 찍으면 패널에서 내용을 적을 수 있게 전체 화면을 끝냅니다.
  const placePin = (position: PinPosition) => {
    if (isFull) changeFull(false);
    onPlacePin?.(position);
  };

  const handleLayerClick = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    placePin({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <section
      className={cn(
        'flex flex-col items-center',
        isFull
          ? 'fixed inset-0 z-30 bg-white'
          : 'bg-stage relative h-full w-full min-w-0 gap-3 px-9 pt-5 pb-[104px] max-[1360px]:px-5 max-[1360px]:pt-4 max-[1360px]:pb-24',
      )}
    >
      {!isFull && (
        <div className="flex gap-2 self-start">
          <button
            type="button"
            aria-label="뒤로"
            title="뒤로"
            onClick={history?.onBack}
            disabled={!history?.canGoBack}
            className={ROUND_BUTTON_CLASS}
          >
            <Icon name="left" size={18} />
          </button>
          <button
            type="button"
            aria-label="앞으로"
            title="앞으로"
            onClick={history?.onForward}
            disabled={!history?.canGoForward}
            className={ROUND_BUTTON_CLASS}
          >
            <Icon name="right" size={18} />
          </button>
        </div>
      )}

      <div
        className={cn(
          'relative flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-white [transition:max-width_0.45s_var(--ease-out-soft),box-shadow_0.25s]',
          DEVICE_WIDTH[device],
          isFull
            ? device !== 'desktop' && 'shadow-[0_0_0_1px_var(--color-divider)]'
            : cn(
                'rounded-[14px]',
                // 핀 모드에서는 틀 둘레를 보라 선으로 표시합니다.
                isPinMode
                  ? 'shadow-[0_0_0_2px_var(--color-brand),0_10px_30px_rgba(24,24,27,0.08)]'
                  : 'shadow-[0_0_0_1px_rgba(24,24,27,0.06),0_10px_30px_rgba(24,24,27,0.08)]',
              ),
        )}
      >
        {!isFull && (
          <BrowserBar
            address={address}
            scriptStatus={scriptStatus}
            onReload={onReload}
            device={device}
            onDeviceChange={setDevice}
            isFull={isFull}
            onToggleFull={() => changeFull(!isFull)}
            showResolved={showResolved}
            onShowResolvedChange={onShowResolvedChange}
          />
        )}

        <div className="relative min-h-0 flex-1 overflow-hidden">
          {/* 브라우저 확대처럼 사이트를 넓게 그린 뒤 줄여서(또는 좁게 그린 뒤 키워서) 맞춥니다. */}
          <div
            className="absolute top-0 left-0 origin-top-left"
            style={{
              width: `${100 / scale}%`,
              height: `${100 / scale}%`,
              transform: scale === 1 ? undefined : `scale(${scale})`,
            }}
          >
            {renderSite?.(mode, placePin) ?? children ?? (
              <p className="text-faint absolute inset-0 grid place-items-center px-6 text-center text-sm">
                {url}
              </p>
            )}
            {/* 핀 모드에서는 사이트 쪽 클릭이 동작하지 않도록 위를 덮습니다. */}
            {ownsPinLayer && isPinMode && (
              <button
                type="button"
                aria-label="핀 추가할 위치 선택"
                onClick={handleLayerClick}
                className="absolute inset-0 cursor-crosshair"
              />
            )}
            {ownsPinLayer && (
              <PinMarkerLayer
                markers={pins.map((pin) => ({ pin, x: pin.x, y: pin.y }))}
                selectedPinId={selectedPinId}
                onSelectPin={onSelectPin}
              />
            )}
            {ownsPinLayer && draftPin && (
              <div
                className="absolute z-20 flex items-start gap-2"
                style={{ left: `${draftPin.x}%`, top: `${draftPin.y}%` }}
              >
                <span className="-translate-y-full">
                  <NumberedPin
                    number={draftPinNumber ?? Math.max(0, ...pins.map((pin) => pin.number)) + 1}
                    kind="draft"
                  />
                </span>
                {draftPinContent}
              </div>
            )}
          </div>
        </div>

        {/* 전체 화면에서는 사이트가 틀을 꽉 채워서 핀 모드 선을 안쪽에 그립니다. */}
        {isFull && isPinMode && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[2] shadow-[inset_0_0_0_2px_var(--color-brand)]"
          />
        )}
      </div>

      {footnote && !isFull && <p className="text-muted -mt-1 self-end text-[13px]">{footnote}</p>}

      {/* 모드 안내는 늘 두고 핀 모드일 때만 내려오며 나타납니다. */}
      <p
        aria-hidden={!isPinMode}
        className={cn(
          NOTE_PLACE_CLASS,
          'bg-ink rounded-[10px] px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap text-white [transition:opacity_0.2s,translate_0.3s_var(--ease-spring)]',
          isFull ? 'top-4' : 'top-[128px]',
          isPinMode ? 'translate-y-0 opacity-100' : '-translate-y-1.5 opacity-0',
        )}
      >
        {placingHint ?? DEFAULT_PIN_HINT}
      </p>
      {notice && (
        <div className={cn(NOTE_PLACE_CLASS, isFull ? 'top-4' : 'top-[128px]')}>
          <div className="pointer-events-auto">{notice}</div>
        </div>
      )}

      <div
        className={cn(
          'absolute left-1/2 z-[3] -translate-x-1/2',
          isFull ? 'bottom-4 opacity-35 transition-opacity hover:opacity-100' : 'bottom-7',
        )}
      >
        <ViewerToolbar
          mode={mode}
          onModeChange={changeMode}
          zoom={zoom}
          onZoomChange={(value) => setZoom(clampZoom(value))}
        />
      </div>
    </section>
  );
};

export default SiteViewer;
