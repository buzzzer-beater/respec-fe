'use client';

import { type FormEvent, useState } from 'react';

import Image from 'next/image';

import sendIcon from '../assets/send.svg';

interface MessageInputProps {
  onSend: (content: string) => void;
  placeholder?: string;
}

const MessageInput = ({ onSend, placeholder = '메시지를 입력하세요' }: MessageInputProps) => {
  const [content, setContent] = useState('');
  const trimmed = content.trim();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmed) return;
    onSend(trimmed);
    setContent('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xsmall shadow-elevation-1 flex w-full items-center gap-2.5 overflow-clip bg-white px-4 py-3"
    >
      <input
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={placeholder}
        aria-label="메시지"
        className="text-ink-800 placeholder:text-ink-300 min-w-0 flex-1 bg-transparent text-base leading-[normal] font-medium outline-none"
      />
      <button
        type="submit"
        aria-label="보내기"
        disabled={!trimmed}
        className="flex size-8 shrink-0 items-center justify-center"
      >
        <Image src={sendIcon} alt="" unoptimized className="-scale-y-100" />
      </button>
    </form>
  );
};

export default MessageInput;
