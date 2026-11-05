import { type Device, DeviceToggle } from '@/features/switch-device';
import { cn } from '@/shared/lib';

import type { ViewerMode } from '../model/types';

const MODES: { value: ViewerMode; label: string }[] = [
  { value: 'browse', label: '체험' },
  { value: 'pin', label: '핀 남기기' },
];

interface ViewerToolbarProps {
  mode: ViewerMode;
  onModeChange: (mode: ViewerMode) => void;
  device: Device;
  onDeviceChange: (device: Device) => void;
  isFull: boolean;
  onToggleFull: () => void;
}

// 미리보기 아래 도구: 모드 · 화면 크기 · 전체 화면
const ViewerToolbar = ({
  mode,
  onModeChange,
  device,
  onDeviceChange,
  isFull,
  onToggleFull,
}: ViewerToolbarProps) => {
  return (
    <div className="flex items-center gap-1.5 rounded-[14px] bg-white p-[5px] shadow-[0_2px_12px_rgba(24,24,27,0.12)]">
      <div role="radiogroup" aria-label="뷰어 모드" className="flex gap-0.5">
        {MODES.map(({ value, label }) => {
          const isSelected = mode === value;

          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onModeChange(value)}
              className={cn(
                'h-10 rounded-[10px] px-4 text-sm font-semibold whitespace-nowrap transition-colors',
                isSelected ? 'bg-ink text-white' : 'text-muted hover:text-ink',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
      <span aria-hidden className="bg-divider h-[22px] w-px" />
      <DeviceToggle value={device} onChange={onDeviceChange} />
      <span aria-hidden className="bg-divider h-[22px] w-px" />
      <button
        type="button"
        onClick={onToggleFull}
        aria-pressed={isFull}
        className="text-text hover:bg-hover h-10 rounded-[10px] px-3.5 text-sm font-semibold whitespace-nowrap"
      >
        {isFull ? '나가기' : '전체 화면'}
        <kbd className="ml-1.5 font-sans text-[11px] opacity-50">{isFull ? 'Esc' : 'F'}</kbd>
      </button>
    </div>
  );
};

export default ViewerToolbar;
