'use client';

import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';

import { cn } from '@/shared/lib';

import { Icon } from './Icon';

export interface DropdownOption<T extends string> {
  value: T;
  label: string;
  /** 오른쪽에 함께 보이는 보조 정보 (예: "핀 3") */
  sub?: string;
}

interface DropdownProps<T extends string> {
  value: T;
  options: readonly DropdownOption<T>[];
  onChange: (value: T) => void;
  /** 화면 읽기용 이름 */
  label: string;
  className?: string;
  /** 단추 모양. 기본은 상단 바용(36px, 배경 없음) */
  triggerClassName?: string;
  menuClassName?: string;
  disabled?: boolean;
}

/**
 * demo-design `enhanceSelect`. 브라우저 기본 메뉴 대신 디자인한 메뉴를 띄웁니다.
 * 위아래 화살표로 옮기고 Esc나 바깥을 누르면 닫힙니다. 미리보기(iframe)를 눌러 창 포커스가 빠져도 닫습니다.
 */
export const Dropdown = <T extends string>({
  value,
  options,
  onChange,
  label,
  className,
  triggerClassName,
  menuClassName,
  disabled,
}: DropdownProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!isOpen) return;
    const close = () => setIsOpen(false);
    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('blur', close);
    // 열리면 고른 항목에 포커스를 둡니다.
    const items = menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]');
    const current = menuRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]');
    (current ?? items?.[0])?.focus();
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('blur', close);
    };
  }, [isOpen]);

  const choose = (next: T) => {
    setIsOpen(false);
    if (next !== value) onChange(next);
    triggerRef.current?.focus();
  };

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowDown', 'ArrowUp', 'Escape'].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.key === 'Escape') {
      setIsOpen(false);
      triggerRef.current?.focus();
      return;
    }
    const items = [
      ...(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? []),
    ];
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    const step = event.key === 'ArrowDown' ? 1 : -1;
    items[(index + step + items.length) % items.length]?.focus();
  };

  return (
    <div
      ref={wrapRef}
      className={cn('group/dd relative', className)}
      data-open={isOpen || undefined}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        aria-label={label}
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
        className={cn(
          'text-ink hover:bg-hover group-data-open/dd:bg-hover inline-flex h-9 items-center gap-1.5 rounded-[10px] pr-2.5 pl-3 text-sm font-bold whitespace-nowrap transition-[background-color,box-shadow] duration-200 group-data-open/dd:shadow-[inset_0_0_0_1px_var(--color-divider)] hover:shadow-[inset_0_0_0_1px_var(--color-divider)] disabled:opacity-60',
          triggerClassName,
        )}
      >
        <span className="truncate">{selected?.label ?? ''}</span>
        {selected?.sub && <span className="text-muted text-xs font-bold">{selected.sub}</span>}
        <Icon
          name="down"
          size={14}
          className="text-muted ease-spring transition-transform duration-300 group-data-open/dd:rotate-180"
        />
      </button>
      {isOpen && (
        <div
          ref={menuRef}
          id={menuId}
          role="listbox"
          aria-label={label}
          onKeyDown={handleMenuKeyDown}
          className={cn(
            'shadow-menu absolute top-[calc(100%+6px)] left-0 z-40 grid min-w-[220px] origin-top-left animate-[dd-in_0.22s_var(--ease-out-soft)] gap-0.5 rounded-[14px] bg-white p-1.5',
            menuClassName,
          )}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => choose(option.value)}
                className={cn(
                  'hover:bg-hover focus-visible:bg-hover flex h-10 items-center gap-2 rounded-[10px] pr-3 pl-2 text-left text-sm whitespace-nowrap focus-visible:outline-none',
                  isSelected ? 'bg-hover text-ink font-bold' : 'text-text font-medium',
                )}
              >
                <span className="grid w-[18px] place-items-center">
                  {isSelected && <Icon name="check" size={15} />}
                </span>
                <span className="flex-1">{option.label}</span>
                {option.sub && (
                  <span
                    className={cn('text-xs font-semibold', isSelected ? 'text-text' : 'text-muted')}
                  >
                    {option.sub}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
