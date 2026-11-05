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

const textClassName = 'text-sm whitespace-pre-wrap wrap-anywhere';

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
    return <p className={cn(textClassName, 'min-w-0 text-neutral-900', className)}>{original}</p>;
  }

  return (
    <dl className={cn('flex min-w-0 flex-col gap-2', className)}>
      <div className="flex flex-col gap-0.5">
        <dt className="text-xs font-medium text-neutral-500">{originalLabel}</dt>
        <dd className={`${textClassName} text-neutral-900`}>{original}</dd>
      </div>
      <div className="flex flex-col gap-0.5 rounded-md bg-sky-50 px-3 py-2">
        <dt className="text-xs font-medium text-sky-700">{plainTextLabel}</dt>
        <dd className={`${textClassName} text-neutral-800`}>{plainText}</dd>
      </div>
    </dl>
  );
};
