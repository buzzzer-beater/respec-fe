'use client';

import { type FormEvent, type KeyboardEvent, useState } from 'react';

import { Button, Textarea } from '@/shared/ui';

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
    // 좁은 화면에서는 핀 옆에 두면 잘려서 화면 위쪽에 고정합니다.
    <form
      onSubmit={handleSubmit}
      className="flex w-80 animate-[slide-in_0.3s_var(--ease-out-soft)] flex-col gap-3 rounded-[14px] bg-white p-4 shadow-[0_0_0_1px_var(--color-divider),0_12px_32px_rgba(24,24,27,0.14)] max-lg:fixed max-lg:inset-x-3 max-lg:top-3 max-lg:w-auto"
    >
      <Textarea
        autoFocus
        rows={3}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="어떤 점을 바꾸고 싶은지 적어 주세요"
        aria-label="수정 요청 내용"
        disabled={isPending}
        className="field-sizing-content max-h-40"
      />
      {errorMessage && (
        <p role="alert" className="text-warn text-xs font-semibold">
          {errorMessage}
        </p>
      )}
      <div className="flex gap-2">
        <Button variant="secondary" onClick={onCancel} className="flex-1">
          취소
        </Button>
        <Button type="submit" disabled={!trimmed || isPending} className="flex-1">
          {isPending ? '보내는 중…' : '요청 보내기'}
        </Button>
      </div>
    </form>
  );
};

export default PinCommentPopover;
