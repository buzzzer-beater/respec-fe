import Image, { type StaticImageData } from 'next/image';

import { cn } from '@/shared/lib';

import commentIcon from '../assets/comment.svg';
import cursorIcon from '../assets/cursor.svg';
import minusIcon from '../assets/minus.svg';
import plusIcon from '../assets/plus.svg';
import separator from '../assets/separator.svg';
import type { ViewerMode } from '../model/types';

const MODES: { value: ViewerMode; label: string; icon: StaticImageData }[] = [
  { value: 'browse', label: '체험 모드', icon: cursorIcon },
  { value: 'pin', label: '핀 모드', icon: commentIcon },
];

interface ViewerToolbarProps {
  mode: ViewerMode;
  onModeChange: (mode: ViewerMode) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
}

const ViewerToolbar = ({
  mode,
  onModeChange,
  zoom,
  onZoomIn,
  onZoomOut,
  onFit,
}: ViewerToolbarProps) => {
  return (
    <div className="shadow-elevation-1 flex items-center gap-4 overflow-clip rounded-full bg-white px-3 py-2.5">
      <div role="radiogroup" aria-label="뷰어 모드" className="flex items-center gap-2.5">
        {MODES.map(({ value, label, icon }) => {
          const isSelected = mode === value;

          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={label}
              onClick={() => onModeChange(value)}
              className={cn(
                'flex size-11 items-center justify-center rounded-full',
                isSelected ? 'bg-primary-strong text-white' : 'text-ink-cool',
              )}
            >
              {/* 선택 상태에 따라 색을 바꾸려고 SVG를 마스크로 씁니다. */}
              <span
                aria-hidden
                className="bg-current"
                style={{ width: icon.width, height: icon.height, maskImage: `url(${icon.src})` }}
              />
            </button>
          );
        })}
      </div>
      <Image src={separator} alt="" unoptimized />
      <div className="flex items-center gap-2.5">
        <button type="button" aria-label="확대" onClick={onZoomIn}>
          <Image src={plusIcon} alt="" unoptimized />
        </button>
        <span className="w-[68px] py-2.5 text-center text-base leading-[normal] font-semibold text-black">
          {zoom}%
        </span>
        <button type="button" aria-label="축소" onClick={onZoomOut}>
          <Image src={minusIcon} alt="" unoptimized />
        </button>
      </div>
      <Image src={separator} alt="" unoptimized />
      <button
        type="button"
        onClick={onFit}
        className="bg-surface-strong rounded-xlarge px-4 py-2.5 text-sm leading-[normal] font-medium whitespace-nowrap text-black"
      >
        화면 맞춤
      </button>
    </div>
  );
};

export default ViewerToolbar;
