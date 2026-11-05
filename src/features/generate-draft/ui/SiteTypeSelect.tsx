'use client';

import {
  SITE_TYPE_DESCRIPTION,
  SITE_TYPE_LABEL,
  SITE_TYPES,
  type SiteType,
} from '@/entities/project';
import { cn } from '@/shared/lib';

interface SiteTypeSelectProps {
  value: SiteType;
  onChange: (value: SiteType) => void;
  disabled?: boolean;
}

/** demo-design `.types`: 회색 상자 안 사이트 유형 카드. 고른 칸만 검정입니다. */
const SiteTypeSelect = ({ value, onChange, disabled = false }: SiteTypeSelectProps) => (
  <div className="grid gap-3">
    <p className="text-base font-extrabold">사이트 유형</p>
    <div role="group" aria-label="사이트 유형" className="grid gap-2">
      {SITE_TYPES.map((type) => {
        const isSelected = type === value;
        return (
          <button
            key={type}
            type="button"
            aria-pressed={isSelected}
            disabled={disabled}
            onClick={() => onChange(type)}
            className={cn(
              'ease-spring grid gap-1 rounded-xl px-[18px] py-4 text-left transition-[transform,background-color,color] duration-300 hover:-translate-y-0.5 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60',
              isSelected ? 'bg-ink text-white' : 'bg-white',
            )}
          >
            <b className="text-[15px] font-extrabold">{SITE_TYPE_LABEL[type]}</b>
            <span
              className={cn('text-xs leading-normal', isSelected ? 'text-white/65' : 'text-muted')}
            >
              {SITE_TYPE_DESCRIPTION[type]}
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

export default SiteTypeSelect;
