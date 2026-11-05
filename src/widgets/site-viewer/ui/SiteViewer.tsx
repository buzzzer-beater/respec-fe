'use client';

import { type MouseEvent, type ReactNode, useEffect, useEffectEvent, useState } from 'react';

import { NumberedPin } from '@/entities/pin';
import type { Device } from '@/features/switch-device';
import { cn } from '@/shared/lib';

import chevronLeftIcon from '../assets/chevron-left.svg';
import chevronRightIcon from '../assets/chevron-right.svg';
import type {
  PinPosition,
  SiteAddress,
  SiteHistoryControls,
  ViewerMode,
  ViewerPin,
} from '../model/types';
import { clampZoom } from '../model/zoom';
import BrowserBar from './BrowserBar';
import MaskIcon from './MaskIcon';
import PinMarkerLayer from './PinMarkerLayer';
import ViewerToolbar from './ViewerToolbar';

const DEVICE_WIDTH: Record<Device, string> = {
  desktop: 'max-w-full',
  tablet: 'max-w-[820px]',
  mobile: 'max-w-[390px]',
};

const ROUND_BUTTON_CLASS =
  'text-text disabled:text-faint enabled:hover:text-ink grid size-9 place-items-center rounded-full bg-white shadow-[0_1px_3px_rgba(24,24,27,0.08)]';

/** 미리보기 위에 띄우는 안내들의 자리(사이트 영역 위쪽 가운데) */
const NOTICE_CLASS = 'absolute top-4 left-1/2 z-30 max-w-[calc(100%-24px)] -translate-x-1/2';

interface SiteViewerProps {
  url: string;
  pins: ViewerPin[];
  onPlacePin?: (position: PinPosition) => void;
  /** 저장 전인 새 핀 위치와, 그 옆에 띄울 입력창 */
  draftPin?: PinPosition | null;
  draftPinContent?: ReactNode;
  onSelectPin?: (pinId: string) => void;
  /** 강조할 핀(채팅의 핀 카드를 눌렀을 때 등) */
  selectedPinId?: string | null;
  /** 사이트가 없을 때 보여 줄 안내(배포 연결 안내 등) */
  children?: ReactNode;
  /**
   * 사이트 영역을 직접 그립니다(초안 미리보기, 배포 사이트). 주면 투명 레이어, 핀 마커, 새 핀도
   * 그 안에서 그려야 해서 여기서는 그리지 않습니다.
   */
  renderSite?: (mode: ViewerMode) => ReactNode;
  /** 핀을 남길 수 없는 이유. 있으면 핀 모드를 끄고 안내합니다. */
  pinDisabledReason?: string | null;
  /** 핀을 막았을 때 기본 안내 문구 대신 보여 줄 안내(버튼이 있는 안내 등) */
  pinDisabledNotice?: ReactNode;
  /** 틀 위쪽 주소창. 지금 보고 있는 페이지와 페이지 목록입니다. */
  address?: SiteAddress;
  /** 사이트 안 이동 기록. 있으면 틀 왼쪽 위에 뒤로/앞으로 버튼을 둡니다. */
  history?: SiteHistoryControls;
  /** 있으면 틀 위쪽에 새로고침 버튼을 둡니다. */
  onReload?: () => void;
  /** 틀 아래 오른쪽 문구("초안 생성 · 3일 전" 등) */
  footnote?: ReactNode;
  /** 있으면 핀 모드로 고정하고 기본 안내 대신 보여 줍니다(핀 위치 다시 지정 등). */
  pinPrompt?: ReactNode;
  /** 해결된 핀 보기. `onShowResolvedChange`를 주면 틀 위쪽에 "완료 보기" 토글을 둡니다. */
  showResolved?: boolean;
  onShowResolvedChange?: (value: boolean) => void;
}

/**
 * 사이트 미리보기를 브라우저 틀로 보여 줍니다.
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
  children,
  renderSite,
  pinDisabledReason,
  pinDisabledNotice,
  address,
  history,
  onReload,
  footnote,
  pinPrompt,
  showResolved,
  onShowResolvedChange,
}: SiteViewerProps) => {
  const [selectedMode, setMode] = useState<ViewerMode>('pin');
  const mode = pinDisabledReason ? 'browse' : pinPrompt ? 'pin' : selectedMode;
  const ownsPinLayer = !renderSite;
  const [device, setDevice] = useState<Device>('desktop');
  const [isFull, setIsFull] = useState(false);
  const [zoom, setZoom] = useState(100);
  const scale = zoom / 100;

  // 단축키: V 체험, C 핀 남기기, F 전체 화면, Esc 전체 화면 나가기(아니면 체험으로).
  // 입력 중이거나 다른 조합키를 누르면 무시합니다. 핀을 막아 두었으면 C는 아무것도 하지 않습니다.
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (key === 'escape') {
      if (isFull) setIsFull(false);
      else setMode('browse');
    } else if (key === 'v') setMode('browse');
    else if (key === 'c' && !pinDisabledReason) setMode('pin');
    else if (key === 'f') setIsFull((value) => !value);
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => handleKeyDown(event);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  const handlePlacePin = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onPlacePin?.({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  };

  const isPinMode = mode === 'pin';

  return (
    <section
      className={cn(
        'flex flex-col items-center',
        isFull
          ? 'fixed inset-0 z-30 bg-white'
          : 'bg-stage relative h-full w-full min-w-0 gap-3 px-3 pt-4 pb-[76px] lg:px-10 lg:pb-[104px]',
      )}
    >
      {history && !isFull && (
        <div className="flex gap-2 self-start">
          <button
            type="button"
            aria-label="뒤로"
            title="뒤로"
            onClick={history.onBack}
            disabled={!history.canGoBack}
            className={ROUND_BUTTON_CLASS}
          >
            <MaskIcon icon={chevronLeftIcon} />
          </button>
          <button
            type="button"
            aria-label="앞으로"
            title="앞으로"
            onClick={history.onForward}
            disabled={!history.canGoForward}
            className={ROUND_BUTTON_CLASS}
          >
            <MaskIcon icon={chevronRightIcon} />
          </button>
        </div>
      )}

      <div
        className={cn(
          'flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-white transition-[max-width,box-shadow] duration-500',
          DEVICE_WIDTH[device],
          isFull
            ? device !== 'desktop' && 'shadow-[0_0_0_1px_var(--color-divider)]'
            : 'rounded-[14px] shadow-[0_0_0_1px_rgba(24,24,27,0.06),0_10px_30px_rgba(24,24,27,0.08)]',
          // 핀 모드에서는 사이트 둘레를 진한 선으로 표시합니다.
          isPinMode &&
            (isFull
              ? 'shadow-[inset_0_0_0_2px_var(--color-ink)]'
              : 'shadow-[0_0_0_2px_var(--color-ink),0_10px_30px_rgba(24,24,27,0.08)]'),
        )}
      >
        <BrowserBar
          address={address}
          onReload={onReload}
          device={device}
          onDeviceChange={setDevice}
          isFull={isFull}
          onToggleFull={() => setIsFull((value) => !value)}
          showResolved={showResolved}
          onShowResolvedChange={onShowResolvedChange}
        />

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
            {renderSite?.(mode) ?? children ?? (
              <p className="text-faint absolute inset-0 grid place-items-center px-6 text-center text-sm">
                {url}
              </p>
            )}
            {/* 핀 모드에서는 사이트 쪽 클릭이 동작하지 않도록 위를 덮습니다. */}
            {ownsPinLayer && isPinMode && (
              <button
                type="button"
                aria-label="핀 추가할 위치 선택"
                onClick={handlePlacePin}
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
                  <NumberedPin number={Math.max(0, ...pins.map((pin) => pin.number)) + 1} draft />
                </span>
                {draftPinContent}
              </div>
            )}
          </div>

          {pinDisabledReason && pinDisabledNotice && (
            <div className={NOTICE_CLASS}>{pinDisabledNotice}</div>
          )}
          {pinDisabledReason && !pinDisabledNotice && (
            <p
              role="status"
              className={cn(
                NOTICE_CLASS,
                'text-muted pointer-events-none w-max rounded-[10px] bg-white px-3.5 py-2 text-center text-[13px] font-semibold shadow-[0_2px_12px_rgba(24,24,27,0.12)]',
              )}
            >
              {pinDisabledReason}
            </p>
          )}
          {isPinMode && !draftPin && !pinPrompt && (
            <p
              className={cn(
                NOTICE_CLASS,
                'bg-ink pointer-events-none w-max rounded-[10px] px-3.5 py-2 text-center text-[13px] font-semibold text-white',
              )}
            >
              바꾸고 싶은 곳을 눌러 주세요 · Esc로 나가기
            </p>
          )}
          {pinPrompt && <div className={NOTICE_CLASS}>{pinPrompt}</div>}
        </div>
      </div>

      {footnote && !isFull && <p className="text-muted -mt-1 self-end text-[13px]">{footnote}</p>}

      <div
        className={cn(
          'absolute left-1/2 z-30 -translate-x-1/2',
          isFull
            ? 'bottom-4 opacity-35 transition-opacity hover:opacity-100'
            : 'bottom-3 lg:bottom-8',
        )}
      >
        <ViewerToolbar
          mode={mode}
          onModeChange={setMode}
          pinDisabledReason={pinDisabledReason}
          zoom={zoom}
          onZoomChange={(value) => setZoom(clampZoom(value))}
        />
      </div>
    </section>
  );
};

export default SiteViewer;
