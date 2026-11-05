import type { ComponentProps } from 'react';

import { cn } from '@/shared/lib';

const VARIANT_CLASS = {
  primary: 'bg-ink text-white transition-transform active:scale-95',
  secondary: 'border-divider text-ink hover:bg-hover border',
  ghost: 'text-muted hover:bg-hover hover:text-ink',
  danger: 'bg-warn text-white transition-transform active:scale-95',
} as const;

const SIZE_CLASS = {
  sm: 'h-7 rounded-lg px-2.5 text-xs',
  md: 'h-10 rounded-xl px-4 text-sm',
} as const;

export type ButtonVariant = keyof typeof VARIANT_CLASS;
export type ButtonSize = keyof typeof SIZE_CLASS;

interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

/** `<button>`이 아닌 요소(복사 버튼 등)에 같은 모양을 입힐 때 씁니다. */
export const buttonClassName = ({
  variant = 'primary',
  size = 'md',
  className,
}: ButtonStyleOptions = {}) =>
  cn('font-semibold disabled:opacity-40', VARIANT_CLASS[variant], SIZE_CLASS[size], className);

export interface ButtonProps extends ComponentProps<'button'>, ButtonStyleOptions {}

/** 기본 `type`은 `button`입니다. 제출 버튼은 `type="submit"`을 넘기세요. */
export const Button = ({ variant, size, className, type = 'button', ...props }: ButtonProps) => (
  <button type={type} className={buttonClassName({ variant, size, className })} {...props} />
);
