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
