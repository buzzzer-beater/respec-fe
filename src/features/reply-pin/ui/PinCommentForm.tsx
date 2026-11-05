'use client';

import { type FormEvent, type KeyboardEvent, useState } from 'react';

import { cn } from '@/shared/lib';

interface PinCommentFormProps {
  /** 성공하면 입력창을 비웁니다. 실패하면 입력한 내용을 그대로 둡니다. */
  onSubmit: (content: string) => Promise<unknown>;
  onCancel?: () => void;
  initialValue?: string;
  placeholder?: string;
  submitLabel?: string;
  isPending?: boolean;
  autoFocus?: boolean;
  className?: string;
}

/** 핀 댓글 답글/수정 입력창. Enter로 보내고 Shift+Enter로 줄바꿈합니다. */
const PinCommentForm = ({
  onSubmit,
  onCancel,
  initialValue = '',
  placeholder = '답글을 입력하세요',
  submitLabel = '답글',
  isPending = false,
  autoFocus = false,
  className,
}: PinCommentFormProps) => {
  const [content, setContent] = useState(initialValue);
  const trimmed = content.trim();
  const canSubmit = trimmed.length > 0 && trimmed !== initialValue.trim() && !isPending;

  const submit = async () => {
    if (!canSubmit) return;
    try {
      await onSubmit(trimmed);
      setContent('');
    } catch {
      // 오류 문구는 호출한 쪽에서 보여 줍니다.
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit();
  };

  // 한글 조합 중 Enter는 무시하고, Esc로 취소합니다.
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape' && onCancel) {
      event.preventDefault();
      onCancel();
      return;
    }
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    void submit();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'border-field focus-within:border-ink flex w-full items-end gap-1.5 rounded-xl border py-1 pr-1 pl-3 transition-colors',
        className,
      )}
    >
      <textarea
        rows={1}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={placeholder}
        autoFocus={autoFocus}
        className="text-ink placeholder:text-faint field-sizing-content max-h-32 min-w-0 flex-1 resize-none bg-transparent py-1.5 text-sm outline-none"
      />
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="text-muted hover:text-ink shrink-0 rounded-lg px-2 py-1.5 text-xs font-semibold"
        >
          취소
        </button>
      )}
      <button
        type="submit"
        disabled={!canSubmit}
        className="bg-ink disabled:bg-divider shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold text-white transition-colors"
      >
        {isPending ? '저장 중' : submitLabel}
      </button>
    </form>
  );
};

export default PinCommentForm;
