'use client';

import { type FormEvent, type KeyboardEvent, useState } from 'react';

interface MessageInputProps {
  onSend: (content: string) => void;
  placeholder?: string;
}

const MessageInput = ({ onSend, placeholder = '메시지를 입력하세요' }: MessageInputProps) => {
  const [content, setContent] = useState('');
  const trimmed = content.trim();

  const send = () => {
    if (!trimmed) return;
    onSend(trimmed);
    setContent('');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    send();
  };

  // Enter로 보내고 Shift+Enter로 줄바꿈합니다. 한글 조합 중 Enter는 무시합니다.
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    send();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-field focus-within:border-ink flex w-full items-end gap-2 rounded-xl border py-1.5 pr-1.5 pl-3.5 transition-colors"
    >
      <textarea
        rows={1}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label="메시지"
        className="text-ink placeholder:text-faint field-sizing-content max-h-32 min-w-0 flex-1 resize-none bg-transparent py-2 text-sm outline-none"
      />
      <button
        type="submit"
        aria-label="보내기"
        disabled={!trimmed}
        className="bg-ink disabled:bg-divider ease-spring grid size-9 shrink-0 place-items-center rounded-[10px] text-white transition-transform duration-300 active:scale-90"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 19V5M5 12l7-7 7 7"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </form>
  );
};

export default MessageInput;
