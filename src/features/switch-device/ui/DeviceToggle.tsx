import { cn } from '@/shared/lib';
import { Icon, type IconName } from '@/shared/ui';

import type { Device } from '../model/types';

const DEVICES: { value: Device; label: string; icon: IconName }[] = [
  { value: 'desktop', label: '데스크톱', icon: 'monitor' },
  { value: 'tablet', label: '태블릿', icon: 'tablet' },
  { value: 'mobile', label: '모바일', icon: 'phone' },
];

const VARIANT = {
  /** 미리보기 주소창 오른쪽 (`.bar-tools .segmented`): 회색 바탕에 흰 칸이 미끄러집니다. */
  bar: {
    group: 'bg-segmented rounded-xl p-0.5',
    thumb:
      'inset-y-[3px] left-0.5 w-[calc((100%-4px)/3)] rounded-[9px] bg-white shadow-[0_1px_3px_rgba(24,24,27,0.1)]',
    button: 'h-7 px-2',
    icon: 15,
  },
  /** 초안 결과 화면 아래 독 (`.dock .segmented`): 바탕 없이 회색 칸이 미끄러집니다. */
  dock: {
    group: 'rounded-[10px]',
    thumb: 'inset-y-0 left-0 w-1/3 rounded-[10px] bg-hover',
    button: 'h-10 px-2.5',
    icon: 16,
  },
} as const;

interface DeviceToggleProps {
  value: Device;
  onChange: (device: Device) => void;
  variant?: keyof typeof VARIANT;
}

/** demo-design `.segmented`: 데스크톱·태블릿·모바일 화면 크기 고르기 */
const DeviceToggle = ({ value, onChange, variant = 'bar' }: DeviceToggleProps) => {
  const style = VARIANT[variant];
  const index = Math.max(
    0,
    DEVICES.findIndex((device) => device.value === value),
  );

  return (
    <div
      role="radiogroup"
      aria-label="화면 크기"
      className={cn('relative inline-flex shrink-0', style.group)}
    >
      <span
        aria-hidden
        className={cn('ease-spring absolute transition-[translate] duration-400', style.thumb)}
        style={{ translate: `${index * 100}% 0` }}
      />
      {DEVICES.map(({ value: device, label, icon }) => {
        const isSelected = device === value;
        return (
          <button
            key={device}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={label}
            title={label}
            onClick={() => onChange(device)}
            className={cn(
              'relative z-[1] inline-flex flex-1 items-center justify-center transition-colors duration-200',
              style.button,
              isSelected ? 'text-ink' : 'text-muted hover:text-ink',
            )}
          >
            <Icon name={icon} size={style.icon} />
          </button>
        );
      })}
    </div>
  );
};

export default DeviceToggle;
