'use client';

import { type FormEvent, type KeyboardEvent, useRef, useState } from 'react';

import { cn, shake } from '@/shared/lib';
import { Icon } from '@/shared/ui';

interface ReplyBoxProps {
  /** 성공하면 입력창을 비웁니다. 실패하면 입력한 내용을 그대로 둡니다. */
  onSubmit: (content: string) => Promise<unknown>;
  placeholder: string;
  isPending?: boolean;
  className?: string;
}

/**
 * 요청 상세 아래의 답글 입력창 (demo-design `.reply`). Enter로 보내고 Shift+Enter로 줄바꿈합니다.
 * 빈 채로 보내면 입력칸을 흔듭니다. 보내기 버튼은 결정 버튼(검정)과 겹치지 않게 회색입니다.
 */
const ReplyBox = ({ onSubmit, placeholder, isPending = false, className }: ReplyBoxProps) => {
  const [content, setContent] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const submit = async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      shake(inputRef.current);
      return;
    }
    if (isPending) return;
    try {
      await onSubmit(trimmed);
      setContent('');
    } catch {
      // 오류 안내는 호출한 쪽에서 합니다.
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit();
  };

  // 한글 조합 중 Enter는 무시합니다.
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    void submit();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'border-field focus-within:border-ink has-[.is-error]:border-alert flex items-end gap-2 rounded-xl border py-1.5 pr-1.5 pl-3.5 transition-colors',
        className,
      )}
    >
      <textarea
        ref={inputRef}
        rows={1}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label="답글"
        className="text-ink placeholder:text-faint field-sizing-content max-h-32 min-h-9 min-w-0 flex-1 resize-none bg-transparent pt-2 text-sm leading-normal outline-none"
      />
      <button
        type="submit"
        aria-label="답글 등록"
        disabled={isPending}
        className="bg-chip text-ink hover:bg-ink ease-spring disabled:bg-divider grid size-9 shrink-0 place-items-center rounded-[10px] transition-[transform,background-color,color] duration-300 hover:text-white active:scale-90"
      >
        <Icon name="send" size={16} />
      </button>
    </form>
  );
};

export default ReplyBox;
