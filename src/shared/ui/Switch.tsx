import type { ComponentProps } from 'react';

import { cn } from '@/shared/lib';

interface SwitchProps extends Omit<ComponentProps<'button'>, 'onChange'> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

/** demo-design `.toggle` + `.switch`. 글자 옆에 작은 켜기/끄기 스위치가 붙습니다. */
export const Switch = ({
  checked,
  onCheckedChange,
  className,
  children,
  type = 'button',
  ...props
}: SwitchProps) => (
  <button
    type={type}
    aria-pressed={checked}
    onClick={() => onCheckedChange(!checked)}
    className={cn(
      'group/switch inline-flex items-center gap-2 text-[13px] font-semibold whitespace-nowrap',
      checked ? 'text-ink' : 'text-muted',
      className,
    )}
    {...props}
  >
    {children}
    <span
      aria-hidden
      className={cn(
        'relative h-[18px] w-[30px] shrink-0 rounded-[9px] transition-colors duration-200',
        checked ? 'bg-ink' : 'bg-switch',
      )}
    >
      <span
        className={cn(
          'ease-spring absolute top-0.5 left-0.5 size-3.5 rounded-full bg-white transition-transform duration-300',
          checked && 'translate-x-3',
        )}
      />
    </span>
  </button>
);
