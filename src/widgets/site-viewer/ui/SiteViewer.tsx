'use client';

import { type MouseEvent, type ReactNode, useEffect, useState } from 'react';

import { NumberedPin } from '@/entities/pin';
import type { Device } from '@/features/switch-device';
import { cn } from '@/shared/lib';

import type { PinPosition, ViewerMode, ViewerPin } from '../model/types';
import ViewerToolbar from './ViewerToolbar';

const DEVICE_WIDTH: Record<Device, string> = {
  desktop: 'max-w-full',
  tablet: 'max-w-[820px]',
  mobile: 'max-w-[390px]',
};

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
  // 배포 사이트 미리보기 자리. 미리보기 방식이 정해지면 채웁니다.
  children?: ReactNode;
  /**
   * 사이트 영역을 직접 그립니다(초안 미리보기). 주면 투명 레이어, 핀 마커, 새 핀도
   * 그 안의 스크롤 영역에서 그려야 해서 여기서는 그리지 않습니다.
   */
  renderSite?: (mode: ViewerMode) => ReactNode;
  /** 핀을 남길 수 없는 이유. 있으면 핀 모드를 끄고 안내합니다. */
  pinDisabledReason?: string | null;
  /** 지금 보고 있는 페이지 경로. 있으면 뷰어 위에 보여 줍니다. */
  pagePath?: string;
}

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
  pagePath,
}: SiteViewerProps) => {
  const [selectedMode, setMode] = useState<ViewerMode>('pin');
  const mode = pinDisabledReason ? 'browse' : selectedMode;
  const ownsPinLayer = !renderSite;
  const [device, setDevice] = useState<Device>('desktop');
  const [isFull, setIsFull] = useState(false);

  // F로 전체 화면, Esc로 나갑니다. 입력 중일 때는 무시합니다.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('input, textarea, [contenteditable="true"]')) return;
      if (event.key === 'Escape') setIsFull(false);
      if (event.key.toLowerCase() === 'f' && !event.metaKey && !event.ctrlKey) {
        setIsFull((value) => !value);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
        'flex justify-center',
        isFull
          ? 'fixed inset-0 z-30 bg-white'
          : 'bg-stage relative h-full w-full min-w-0 px-3 pt-8 pb-[76px] lg:px-10 lg:pb-[104px]',
      )}
    >
      <div
        className={cn(
          'relative h-full w-full overflow-hidden bg-white transition-[max-width,box-shadow] duration-500',
          DEVICE_WIDTH[device],
          isFull
            ? device !== 'desktop' && 'shadow-[0_0_0_1px_var(--color-divider)]'
            : 'rounded-[10px] shadow-[0_0_0_1px_rgba(24,24,27,0.06),0_8px_30px_rgba(24,24,27,0.08)]',
          // 핀 모드에서는 사이트 둘레를 진한 선으로 표시합니다.
          isPinMode &&
            (isFull
              ? 'shadow-[inset_0_0_0_2px_var(--color-ink)]'
              : 'shadow-[0_0_0_2px_var(--color-ink),0_8px_30px_rgba(24,24,27,0.08)]'),
        )}
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
        {/* 초안 미리보기는 핀을 미리보기 안에서 직접 그립니다. */}
        {(ownsPinLayer ? pins : []).map((pin) => {
          const isSelected = pin.id === selectedPinId;
          return (
            <button
              key={pin.id}
              type="button"
              aria-label={`${pin.number}번 핀`}
              aria-pressed={isSelected}
              onClick={() => onSelectPin?.(pin.id)}
              className={cn(
                'group absolute -translate-y-full hover:z-20',
                isSelected ? 'z-20' : 'z-10',
              )}
              style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
            >
              <NumberedPin
                number={pin.number}
                muted={pin.muted && !isSelected}
                className={cn(isSelected && 'ring-brand/30 scale-110 ring-4')}
              />
            </button>
          );
        })}
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

      {pagePath && !isFull && (
        <p className="text-muted absolute inset-x-3 top-0 flex h-8 items-center gap-1.5 text-xs font-semibold lg:inset-x-10">
          <span className="shrink-0">페이지</span>
          <span className="text-ink truncate font-mono" title={pagePath}>
            {pagePath}
          </span>
        </p>
      )}

      {pinDisabledReason && (
        <p
          role="status"
          className={cn(
            'text-muted pointer-events-none absolute left-1/2 z-30 w-max max-w-[calc(100%-24px)] -translate-x-1/2 rounded-[10px] bg-white px-3.5 py-2 text-center text-[13px] font-semibold shadow-[0_2px_12px_rgba(24,24,27,0.12)]',
            isFull ? 'top-4' : 'top-12',
          )}
        >
          {pinDisabledReason}
        </p>
      )}

      {isPinMode && !draftPin && (
        <p
          className={cn(
            'bg-ink pointer-events-none absolute left-1/2 z-30 w-max max-w-[calc(100%-24px)] -translate-x-1/2 rounded-[10px] px-3.5 py-2 text-center text-[13px] font-semibold text-white',
            isFull ? 'top-4' : 'top-12',
          )}
        >
          사이트를 눌러 바꾸고 싶은 곳에 핀을 남기세요
        </p>
      )}

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
          device={device}
          onDeviceChange={setDevice}
          isFull={isFull}
          onToggleFull={() => setIsFull((value) => !value)}
        />
      </div>
    </section>
  );
};

export default SiteViewer;
