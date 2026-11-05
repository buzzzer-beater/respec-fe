import type { StaticImageData } from 'next/image';

import { cn } from '@/shared/lib';

import desktopIcon from '../assets/desktop.svg';
import mobileIcon from '../assets/mobile.svg';
import tabletIcon from '../assets/tablet.svg';
import type { Device } from '../model/types';

const DEVICES: { value: Device; label: string; icon: StaticImageData }[] = [
  { value: 'desktop', label: '데스크톱', icon: desktopIcon },
  { value: 'tablet', label: '태블릿', icon: tabletIcon },
  { value: 'mobile', label: '모바일', icon: mobileIcon },
];

interface DeviceToggleProps {
  value: Device;
  onChange: (device: Device) => void;
}

const DeviceToggle = ({ value, onChange }: DeviceToggleProps) => {
  return (
    <div
      role="radiogroup"
      aria-label="미리보기 화면 크기"
      className="bg-surface-cool rounded-small flex shrink-0 gap-0.5 p-[3px]"
    >
      {DEVICES.map(({ value: device, label, icon }) => {
        const isSelected = device === value;

        return (
          <button
            key={device}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={label}
            onClick={() => onChange(device)}
            className={cn(
              'flex h-7 w-8 items-center justify-center rounded-[7px]',
              isSelected ? 'shadow-segment text-ink-950 bg-white' : 'text-ink-550',
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
  );
};

export default DeviceToggle;
