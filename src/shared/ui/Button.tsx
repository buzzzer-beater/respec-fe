import type { ComponentProps } from 'react';

import { cn } from '@/shared/lib';

// demo-design `.btn-dark` / `.btn-line` / `.icon-btn` 기준입니다.
const VARIANT_CLASS = {
  primary: 'bg-ink hover:bg-ink-hover text-white',
  secondary: 'border-divider text-ink hover:bg-hover border bg-white',
  ghost: 'text-muted hover:bg-hover hover:text-ink',
  danger: 'bg-warn text-white',
} as const;

const SIZE_CLASS = {
  sm: 'h-8 rounded-[10px] px-3 text-[13px]',
  md: 'h-10 rounded-xl px-4 text-sm',
  /** 패널 아래 결정 버튼처럼 큰 버튼 */
  lg: 'h-12 rounded-xl px-5 text-[15px]',
} as const;

export type ButtonVariant = keyof typeof VARIANT_CLASS;
export type ButtonSize = keyof typeof SIZE_CLASS;

interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

/** `<button>`이 아닌 요소(링크 등)에 같은 모양을 입힐 때 씁니다. */
export const buttonClassName = ({
  variant = 'primary',
  size = 'md',
  className,
}: ButtonStyleOptions = {}) =>
  cn(
    'ease-spring inline-flex items-center justify-center gap-1.5 font-semibold whitespace-nowrap transition-[transform,background-color] duration-300 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-60',
    VARIANT_CLASS[variant],
    SIZE_CLASS[size],
    className,
  );

export interface ButtonProps extends ComponentProps<'button'>, ButtonStyleOptions {}

/** 기본 `type`은 `button`입니다. 제출 버튼은 `type="submit"`을 넘기세요. */
export const Button = ({ variant, size, className, type = 'button', ...props }: ButtonProps) => (
  <button type={type} className={buttonClassName({ variant, size, className })} {...props} />
);

/** demo-design `.icon-btn`. 아이콘만 있는 버튼이라 `aria-label`을 꼭 넘기세요. */
export const iconButtonClassName = (className?: string) =>
  cn(
    'text-muted hover:bg-hover hover:text-ink ease-spring grid size-8 shrink-0 place-items-center rounded-[9px] transition-[transform,background-color,color] duration-300 active:scale-[0.88] disabled:pointer-events-none disabled:opacity-40',
    className,
  );

export const IconButton = ({ className, type = 'button', ...props }: ComponentProps<'button'>) => (
  <button type={type} className={iconButtonClassName(className)} {...props} />
);
