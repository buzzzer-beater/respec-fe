import type { StaticImageData } from 'next/image';

import { cn } from '@/shared/lib';

import cursorIcon from '../assets/cursor.svg';
import messageIcon from '../assets/message.svg';
import minusIcon from '../assets/minus.svg';
import plusIcon from '../assets/plus.svg';
import type { ViewerMode } from '../model/types';
import { ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from '../model/zoom';
import MaskIcon from './MaskIcon';

const MODES: { value: ViewerMode; label: string; shortcut: string; icon: StaticImageData }[] = [
  { value: 'browse', label: '체험', shortcut: 'V', icon: cursorIcon },
  { value: 'pin', label: '핀 남기기', shortcut: 'C', icon: messageIcon },
];

const Divider = () => <span aria-hidden className="bg-divider h-[26px] w-px shrink-0" />;

interface ViewerToolbarProps {
  mode: ViewerMode;
  onModeChange: (mode: ViewerMode) => void;
  /** 있으면 핀 모드 버튼을 비활성화하고 이유를 툴팁으로 보여 줍니다. */
  pinDisabledReason?: string | null;
  /** 확대 배율(%) */
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

// 미리보기 아래 도구: 체험·핀 남기기 | 확대 + 100% − | 화면 맞춤.
// 화면 크기, 완료 보기, 전체 화면은 틀 위쪽(`BrowserBar`)에 있습니다.
const ViewerToolbar = ({
  mode,
  onModeChange,
  pinDisabledReason,
  zoom,
  onZoomChange,
}: ViewerToolbarProps) => {
  return (
    <div
      role="toolbar"
      aria-label="미리보기 도구"
      className="flex items-center gap-4 rounded-full bg-white px-3 py-2.5 shadow-[0_3px_10px_rgba(0,0,0,0.02)]"
    >
      <div role="radiogroup" aria-label="뷰어 모드" className="flex gap-2.5">
        {MODES.map(({ value, label, shortcut, icon }) => {
          const isSelected = mode === value;
          const isDisabled = value === 'pin' && !!pinDisabledReason;

          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${label} (${shortcut})`}
              aria-keyshortcuts={shortcut}
              onClick={() => onModeChange(value)}
              disabled={isDisabled}
              title={isDisabled ? (pinDisabledReason ?? label) : `${label} · ${shortcut}`}
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
        <output
          aria-label={`확대 배율 ${zoom}%`}
          className="min-w-[62px] text-center text-base leading-none font-semibold text-black tabular-nums"
        >
          {zoom}%
        </output>
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

      <Divider />
      {/* 미리보기 상자는 이미 틀 너비에 맞춰 그리므로 100%가 화면에 맞는 배율입니다. */}
      <button
        type="button"
        onClick={() => onZoomChange(100)}
        disabled={zoom === 100}
        className="bg-hover text-ink disabled:hover:bg-hover h-10 rounded-full px-4 text-sm font-semibold whitespace-nowrap hover:bg-[#e8e8ec] disabled:opacity-50"
      >
        화면 맞춤
      </button>
    </div>
  );
};

export default ViewerToolbar;
