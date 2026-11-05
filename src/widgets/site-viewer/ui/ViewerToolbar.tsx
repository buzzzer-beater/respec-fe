import { cn } from '@/shared/lib';
import { Icon, IconButton, type IconName } from '@/shared/ui';

import type { ViewerMode } from '../model/types';
import { ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from '../model/zoom';

const MODES: { value: ViewerMode; label: string; shortcut: string; icon: IconName }[] = [
  { value: 'browse', label: '체험', shortcut: 'V', icon: 'cursor' },
  { value: 'pin', label: '핀 남기기', shortcut: 'C', icon: 'comment' },
];

const Divider = () => <span aria-hidden className="bg-divider mx-1 h-6 w-px shrink-0" />;

interface ViewerToolbarProps {
  mode: ViewerMode;
  /** 핀 모드 버튼은 막지 않고 누르면 부릅니다. 핀을 찍을 수 없으면 부르는 쪽이 안내합니다. */
  onModeChange: (mode: ViewerMode) => void;
  /** 확대 배율(%) */
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

// demo-design `.dock`: 체험·핀 남기기 | 확대 + 100% − | 화면 맞춤.
// 화면 크기, 완료 보기, 전체 화면은 틀 위쪽(`BrowserBar`)에 있습니다.
const ViewerToolbar = ({ mode, onModeChange, zoom, onZoomChange }: ViewerToolbarProps) => (
  <div
    role="toolbar"
    aria-label="미리보기 도구"
    className="flex items-center gap-1 rounded-full bg-white px-2 py-1.5 shadow-[0_4px_18px_rgba(24,24,27,0.1)]"
  >
    <div role="group" aria-label="모드" className="flex gap-1">
      {MODES.map(({ value, label, shortcut, icon }) => {
        const isSelected = mode === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={isSelected}
            aria-label={`${label} (${shortcut})`}
            aria-keyshortcuts={shortcut}
            title={`${label} · ${shortcut}`}
            onClick={() => onModeChange(value)}
            className={cn(
              'grid size-11 place-items-center rounded-full transition-colors duration-200',
              // 체험은 고르면 회색, 핀 남기기는 고르면 보라로 채웁니다.
              isSelected
                ? value === 'pin'
                  ? 'bg-brand text-white'
                  : 'bg-hover text-ink'
                : 'text-text hover:bg-hover',
            )}
          >
            <Icon name={icon} size={18} />
          </button>
        );
      })}
    </div>

    <Divider />

    <IconButton
      aria-label="확대"
      title="확대"
      onClick={() => onZoomChange(zoom + ZOOM_STEP)}
      disabled={zoom >= ZOOM_MAX}
      className="size-10"
    >
      <Icon name="plus" size={18} />
    </IconButton>
    <output
      aria-label={`확대 배율 ${zoom}%`}
      className="text-ink min-w-14 text-center text-base font-bold tabular-nums"
    >
      {zoom}%
    </output>
    <IconButton
      aria-label="축소"
      title="축소"
      onClick={() => onZoomChange(zoom - ZOOM_STEP)}
      disabled={zoom <= ZOOM_MIN}
      className="size-10"
    >
      <Icon name="minus" size={18} />
    </IconButton>

    <Divider />
    {/* 미리보기 상자는 이미 틀 너비에 맞춰 그리므로 100%가 화면에 맞는 배율입니다. */}
    <button
      type="button"
      onClick={() => onZoomChange(100)}
      className="bg-hover text-ink h-10 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors hover:bg-[#e8e8ec]"
    >
      화면 맞춤
    </button>
  </div>
);

export default ViewerToolbar;
