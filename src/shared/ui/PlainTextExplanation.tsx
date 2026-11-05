'use client';

import { useState } from 'react';

import type { AiStatus } from '@/shared/api';
import { cn } from '@/shared/lib';

export type PlainTextExplanationProps = {
  /** 사람이 쓴 원문. 항상 표시합니다. */
  original: string;
  /** AI가 바꾼 쉬운 설명. 없거나 빈 문자열이면 원문만 표시합니다. */
  plainText?: string | null;
  originalLabel?: string;
  plainTextLabel?: string;
  className?: string;
};

const textClassName = 'whitespace-pre-wrap wrap-anywhere';

/**
 * 원문과 AI 쉬운 설명을 함께 보여 줍니다.
 * 변환본만 보여 주지 않도록 원문은 항상 펼쳐서 표시합니다.
 */
export const PlainTextExplanation = ({
  original,
  plainText,
  originalLabel = '원문',
  plainTextLabel = '쉬운 설명',
  className,
}: PlainTextExplanationProps) => {
  if (!plainText?.trim()) {
    return <p className={cn(textClassName, 'text-ink min-w-0', className)}>{original}</p>;
  }

  return (
    <dl className={cn('flex min-w-0 flex-col gap-2.5', className)}>
      <div className="flex flex-col gap-1">
        <dt className="text-muted text-xs font-semibold">{originalLabel}</dt>
        <dd className={cn(textClassName, 'text-ink')}>{original}</dd>
      </div>
      <div className="bg-ai flex flex-col gap-1 rounded-[10px] px-3 py-2.5">
        <dt className="text-text text-xs font-bold">{plainTextLabel}</dt>
        <dd className={cn(textClassName, 'text-text text-[13px] leading-relaxed')}>{plainText}</dd>
      </div>
    </dl>
  );
};

/** demo-design `.ai-badge`: AI가 만든 내용 앞에 붙이는 작은 회색 표시 */
export const AiBadge = () => (
  <span className="bg-chip text-text rounded-md px-1.5 py-px text-[10px] font-extrabold">AI</span>
);

const inlineClassName = 'text-muted inline-flex items-center gap-1.5 text-xs font-semibold';

export type AiPlainTextProps = {
  /** AI 변환본. 완료 전이거나 실패하면 `null` */
  plainText: string | null | undefined;
  status: AiStatus | null | undefined;
  /** "쉬운 풀이"(개발자가 쓴 글) 또는 "개발자용 정리"(고객이 쓴 글) */
  label: string;
  /** 만드는 중 문구. 기본은 "정리하는 중…" */
  pendingLabel?: string;
  className?: string;
};

/**
 * 원문 아래에 접어 두는 AI 설명 (demo-design `.ai-inline`).
 * 원문은 말풍선에 항상 보이고, 이 줄은 눌러야 펼쳐집니다. 만드는 중이면 문구만, 실패·생략이면 아무것도 그리지 않습니다.
 */
export const AiPlainText = ({
  plainText,
  status,
  label,
  pendingLabel = '정리하는 중…',
  className,
}: AiPlainTextProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (status === 'pending') {
    return (
      <div className={cn(inlineClassName, className)}>
        <AiBadge />
        {pendingLabel}
      </div>
    );
  }
  if (!plainText?.trim()) return null;

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-expanded={false}
        className={cn(inlineClassName, 'hover:text-ink transition-colors', className)}
      >
        <AiBadge />
        {label} 보기
      </button>
    );
  }

  return (
    <div className={cn('bg-ai block max-w-full rounded-[10px] px-3 py-2.5 text-xs', className)}>
      <div className="text-text mb-1 flex items-center gap-1.5 font-bold">
        <AiBadge />
        {label}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-expanded
          className="text-muted hover:text-ink ml-auto text-xs"
        >
          접기
        </button>
      </div>
      <p className={cn(textClassName, 'text-text text-[13px] leading-[1.6]')}>{plainText}</p>
    </div>
  );
};
