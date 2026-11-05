'use client';

import { type MouseEvent, type ReactNode, useEffect, useState } from 'react';

import { NumberedPin } from '@/entities/pin';
import type { Device } from '@/features/switch-device';
import { cn } from '@/shared/lib';

import type { PinPosition, ViewerMode, ViewerPin } from '../model/types';
import PinMarkerLayer from './PinMarkerLayer';
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
  /** 해결된 핀 보기. `onShowResolvedChange`를 주면 도구 막대에 "완료 보기" 토글을 둡니다. */
  showResolved?: boolean;
  onShowResolvedChange?: (value: boolean) => void;
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
  showResolved,
  onShowResolvedChange,
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
          : 'bg-stage relative h-full w-full min-w-0 px-10 pt-8 pb-[104px]',
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

      {pinDisabledReason && (
        <p
          role="status"
          className={cn(
            'text-muted pointer-events-none absolute left-1/2 z-30 -translate-x-1/2 rounded-[10px] bg-white px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap shadow-[0_2px_12px_rgba(24,24,27,0.12)]',
            isFull ? 'top-4' : 'top-12',
          )}
        >
          {pinDisabledReason}
        </p>
      )}

      {isPinMode && !draftPin && (
        <p
          className={cn(
            'bg-ink pointer-events-none absolute left-1/2 z-30 -translate-x-1/2 rounded-[10px] px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap text-white',
            isFull ? 'top-4' : 'top-12',
          )}
        >
          사이트를 눌러 바꾸고 싶은 곳에 핀을 남기세요
        </p>
      )}

      <div
        className={cn(
          'absolute left-1/2 z-30 -translate-x-1/2',
          isFull ? 'bottom-4 opacity-35 transition-opacity hover:opacity-100' : 'bottom-8',
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
          showResolved={showResolved}
          onShowResolvedChange={onShowResolvedChange}
        />
      </div>
    </section>
  );
};

export default SiteViewer;
