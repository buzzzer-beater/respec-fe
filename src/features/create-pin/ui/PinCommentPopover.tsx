'use client';

import { type FormEvent, type KeyboardEvent, useState } from 'react';

interface PinCommentPopoverProps {
  onSubmit: (content: string) => void;
  onCancel: () => void;
  isPending?: boolean;
  errorMessage?: string | null;
}

const PinCommentPopover = ({
  onSubmit,
  onCancel,
  isPending = false,
  errorMessage,
}: PinCommentPopoverProps) => {
  const [content, setContent] = useState('');
  const trimmed = content.trim();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (trimmed && !isPending) onSubmit(trimmed);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape') onCancel();
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (trimmed && !isPending) onSubmit(trimmed);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-80 animate-[slide-in_0.3s_var(--ease-out-soft)] flex-col gap-3 rounded-[14px] bg-white p-4 shadow-[0_0_0_1px_var(--color-divider),0_12px_32px_rgba(24,24,27,0.14)]"
    >
      <textarea
        autoFocus
        rows={3}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="어떤 점을 바꾸고 싶은지 적어 주세요"
        aria-label="수정 요청 내용"
        disabled={isPending}
        className="border-field text-ink placeholder:text-faint focus:border-ink field-sizing-content max-h-40 w-full resize-none rounded-xl border px-3.5 py-3 text-[15px] leading-normal outline-none"
      />
      {errorMessage && (
        <p role="alert" className="text-warn text-xs font-semibold">
          {errorMessage}
        </p>
      )}
      <div className="flex gap-2 text-sm font-semibold">
        <button
          type="button"
          onClick={onCancel}
          className="border-divider text-ink hover:bg-hover h-10 flex-1 rounded-xl border"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={!trimmed || isPending}
          className="bg-ink h-10 flex-1 rounded-xl text-white transition-transform active:scale-95 disabled:opacity-40"
        >
          {isPending ? '보내는 중…' : '요청 보내기'}
        </button>
      </div>
    </form>
  );
};

export default PinCommentPopover;
