'use client';

import { SITE_TYPE_LABEL, type SiteType } from '@/entities/project';
import { cn } from '@/shared/lib';

interface SiteTypeSelectProps {
  /** `null`이면 유형을 정하지 않고 설명만 보냅니다. */
  value: SiteType | null;
  onChange: (value: SiteType | null) => void;
  disabled?: boolean;
  layout?: 'chips' | 'cards';
}

const OPTIONS: { value: SiteType | null; label: string; description: string }[] = [
  { value: 'shop', label: SITE_TYPE_LABEL.shop, description: '상품 목록 · 상세 · 장바구니' },
  { value: 'landing', label: '랜딩', description: '소개 · 특징 · 문의' },
  { value: 'booking', label: SITE_TYPE_LABEL.booking, description: '메뉴 · 날짜 선택 · 예약 확인' },
  { value: null, label: '선택 안 함', description: '원하는 방향을 설명으로 알려 주세요' },
];

const SiteTypeSelect = ({
  value,
  onChange,
  disabled = false,
  layout = 'chips',
}: SiteTypeSelectProps) => {
  return (
    <fieldset className="flex min-w-0 flex-col gap-3" disabled={disabled}>
      <legend
        className={`text-text text-base font-extrabold ${layout === 'chips' ? 'text-muted self-center text-[13px] font-normal' : ''}`}
      >
        사이트 유형
      </legend>
      <div className={layout === 'cards' ? 'grid gap-2' : 'flex flex-wrap justify-center gap-1.5'}>
        {OPTIONS.map((option) => (
          <label
            key={option.label}
            className={cn(
              layout === 'cards'
                ? 'flex cursor-pointer flex-col gap-1 rounded-xl px-4 py-3.5 text-left transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2'
                : 'flex h-9 cursor-pointer items-center rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2',
              option.value === value
                ? layout === 'cards'
                  ? 'bg-ink text-white'
                  : 'border-ink bg-ink text-white'
                : layout === 'cards'
                  ? 'text-text bg-white hover:bg-[#e8e8ec]'
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
            {layout === 'cards' ? (
              <>
                <span className="text-sm font-extrabold">{option.label}</span>
                <span
                  className={`text-xs leading-relaxed ${option.value === value ? 'text-white/65' : 'text-muted'}`}
                >
                  {option.description}
                </span>
              </>
            ) : (
              option.label
            )}
          </label>
        ))}
      </div>
    </fieldset>
  );
};

export default SiteTypeSelect;
