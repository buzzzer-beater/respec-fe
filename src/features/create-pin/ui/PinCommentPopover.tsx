'use client';

import { type FormEvent, type KeyboardEvent, useState } from 'react';

interface PinCommentPopoverProps {
  onSubmit: (content: string) => void;
  onCancel: () => void;
  isPending?: boolean;
  errorMessage?: string | null;
}

// 디자인 시안이 없어 기존 토큰으로만 만든 임시 입력창입니다.
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
      className="rounded-xsmall shadow-elevation-2 border-line-subtle flex w-72 flex-col gap-3 border bg-white p-3"
    >
      <textarea
        autoFocus
        rows={2}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="어떤 점을 바꾸고 싶은지 적어 주세요"
        aria-label="수정 요청 내용"
        disabled={isPending}
        className="text-ink-800 placeholder:text-ink-300 field-sizing-content max-h-40 w-full resize-none text-sm outline-none"
      />
      {errorMessage && (
        <p role="alert" className="text-danger text-xs">
          {errorMessage}
        </p>
      )}
      <div className="flex justify-end gap-2 text-sm">
        <button type="button" onClick={onCancel} className="text-ink-600 px-2 py-1">
          취소
        </button>
        <button
          type="submit"
          disabled={!trimmed || isPending}
          className="bg-primary-strong rounded-xs px-3 py-1 font-medium text-white disabled:opacity-50"
        >
          {isPending ? '등록 중…' : '등록'}
        </button>
      </div>
    </form>
  );
};

export default PinCommentPopover;
