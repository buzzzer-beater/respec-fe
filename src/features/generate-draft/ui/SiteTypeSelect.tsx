'use client';

import { SITE_TYPE_LABEL, SITE_TYPES, type SiteType } from '@/entities/project';
import { cn } from '@/shared/lib';

interface SiteTypeSelectProps {
  /** `null`이면 유형을 정하지 않고 설명만 보냅니다. */
  value: SiteType | null;
  onChange: (value: SiteType | null) => void;
  disabled?: boolean;
}

const OPTIONS: { value: SiteType | null; label: string }[] = [
  ...SITE_TYPES.map((type) => ({ value: type, label: SITE_TYPE_LABEL[type] })),
  { value: null, label: '선택 안 함' },
];

const SiteTypeSelect = ({ value, onChange, disabled = false }: SiteTypeSelectProps) => {
  return (
    <fieldset className="flex flex-col items-center gap-3" disabled={disabled}>
      <legend className="text-muted mb-3 text-center text-[13px]">사이트 유형</legend>
      <div className="flex flex-wrap justify-center gap-1.5">
        {OPTIONS.map((option) => (
          <label
            key={option.label}
            className={cn(
              'flex h-9 cursor-pointer items-center rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2',
              option.value === value
                ? 'border-ink bg-ink text-white'
                : 'border-field text-text hover:border-ink bg-white',
              disabled && 'cursor-not-allowed opacity-60',
            )}
          >
            <input
              type="radio"
              name="site-type"
              className="sr-only"
              checked={option.value === value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
};

export default SiteTypeSelect;
