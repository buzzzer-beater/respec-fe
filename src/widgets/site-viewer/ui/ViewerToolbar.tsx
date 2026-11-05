import type { StaticImageData } from 'next/image';

import { type Device, DeviceToggle } from '@/features/switch-device';
import { cn } from '@/shared/lib';

import cursorIcon from '../assets/cursor.svg';
import messageIcon from '../assets/message.svg';
import minusIcon from '../assets/minus.svg';
import plusIcon from '../assets/plus.svg';
import type { ViewerMode } from '../model/types';
import { ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from '../model/zoom';

const MODES: { value: ViewerMode; label: string; icon: StaticImageData }[] = [
  { value: 'browse', label: '체험', icon: cursorIcon },
  { value: 'pin', label: '핀 남기기', icon: messageIcon },
];

// 상태에 따라 색을 바꾸려고 SVG를 마스크로 씁니다.
const MaskIcon = ({ icon }: { icon: StaticImageData }) => (
  <span
    aria-hidden
    className="bg-current"
    style={{ width: icon.width, height: icon.height, maskImage: `url(${icon.src})` }}
  />
);

const Divider = () => <span aria-hidden className="bg-divider h-[26px] w-px shrink-0" />;

interface ViewerToolbarProps {
  mode: ViewerMode;
  onModeChange: (mode: ViewerMode) => void;
  /** 있으면 핀 모드 버튼을 비활성화하고 이유를 툴팁으로 보여 줍니다. */
  pinDisabledReason?: string | null;
  /** 확대 배율(%) */
  zoom: number;
  onZoomChange: (zoom: number) => void;
  device: Device;
  onDeviceChange: (device: Device) => void;
  isFull: boolean;
  onToggleFull: () => void;
  /** 주면 해결된 핀을 보이고 숨기는 "완료 보기" 토글을 둡니다. */
  showResolved?: boolean;
  onShowResolvedChange?: (value: boolean) => void;
}

// 미리보기 아래 도구: 모드 · 확대 · 화면 크기 · 완료 보기 · 전체 화면
const ViewerToolbar = ({
  mode,
  onModeChange,
  pinDisabledReason,
  zoom,
  onZoomChange,
  device,
  onDeviceChange,
  isFull,
  onToggleFull,
  showResolved = false,
  onShowResolvedChange,
}: ViewerToolbarProps) => {
  return (
    <div className="flex items-center gap-4 rounded-full bg-white px-3 py-2.5 shadow-[0_3px_10px_rgba(0,0,0,0.02)]">
      <div role="radiogroup" aria-label="뷰어 모드" className="flex gap-2.5">
        {MODES.map(({ value, label, icon }) => {
          const isSelected = mode === value;
          const isDisabled = value === 'pin' && !!pinDisabledReason;

          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={label}
              onClick={() => onModeChange(value)}
              disabled={isDisabled}
              title={isDisabled ? (pinDisabledReason ?? label) : label}
              className={cn(
                'grid size-11 place-items-center rounded-full transition-colors',
                isSelected ? 'bg-brand text-white' : 'text-text hover:bg-hover',
                'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent',
              )}
            >
              <MaskIcon icon={icon} />
            </button>
          );
        })}
      </div>

      <Divider />

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          aria-label="확대"
          title="확대"
          onClick={() => onZoomChange(zoom + ZOOM_STEP)}
          disabled={zoom >= ZOOM_MAX}
          className="hover:text-ink grid size-5 place-items-center text-[#666a71] disabled:opacity-40"
        >
          <MaskIcon icon={plusIcon} />
        </button>
        <button
          type="button"
          aria-label={`확대 배율 ${zoom}%, 누르면 100%로 돌아가기`}
          title="100%로 돌아가기"
          onClick={() => onZoomChange(100)}
          className="min-w-[78px] rounded-[20px] px-4 py-2.5 text-base leading-none font-semibold text-black tabular-nums"
        >
          {zoom}%
        </button>
        <button
          type="button"
          aria-label="축소"
          title="축소"
          onClick={() => onZoomChange(zoom - ZOOM_STEP)}
          disabled={zoom <= ZOOM_MIN}
          className="hover:text-ink grid size-5 place-items-center text-[#666a71] disabled:opacity-40"
        >
          <MaskIcon icon={minusIcon} />
        </button>
      </div>

      {/* 좁은 화면에서는 화면이 이미 작아서 크기 선택을 숨깁니다. */}
      <div className="hidden items-center gap-4 lg:flex">
        <Divider />
        <DeviceToggle value={device} onChange={onDeviceChange} />
      </div>

      {onShowResolvedChange && (
        <>
          <Divider />
          <button
            type="button"
            onClick={() => onShowResolvedChange(!showResolved)}
            aria-pressed={showResolved}
            className="text-text hover:bg-hover aria-pressed:bg-brand-soft aria-pressed:text-brand h-10 rounded-full px-3.5 text-sm font-semibold whitespace-nowrap"
          >
            완료 보기
          </button>
        </>
      )}

      <Divider />
      <button
        type="button"
        onClick={onToggleFull}
        aria-pressed={isFull}
        className="text-text hover:bg-hover h-10 rounded-full px-3.5 text-sm font-semibold whitespace-nowrap"
      >
        {isFull ? '나가기' : '전체 화면'}
        <kbd className="ml-1.5 hidden font-sans text-[11px] opacity-50 lg:inline">
          {isFull ? 'Esc' : 'F'}
        </kbd>
      </button>
    </div>
  );
};

export default ViewerToolbar;
