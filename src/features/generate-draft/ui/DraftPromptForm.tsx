'use client';

import { type FormEvent, type KeyboardEvent, useState } from 'react';

import Image from 'next/image';

import plusIcon from '../assets/plus.svg';
import submitArrowIcon from '../assets/submit-arrow.svg';

const EXAMPLES = ['브랜드 소개 사이트', '이커머스 랜딩', 'SaaS 제품 소개', '포트폴리오'];

interface DraftPromptFormProps {
  onSubmit?: (prompt: string) => void;
  /** 생성 중에는 입력과 제출을 막습니다. */
  disabled?: boolean;
}

const DraftPromptForm = ({ onSubmit, disabled = false }: DraftPromptFormProps) => {
  const [prompt, setPrompt] = useState('');
  const trimmed = prompt.trim();

  const submit = () => {
    if (!trimmed || disabled) return;
    onSubmit?.(trimmed);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  // Enter로 보내고 Shift+Enter로 줄바꿈합니다. 한글 조합 중 Enter는 무시합니다.
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    submit();
  };

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <form
        onSubmit={handleSubmit}
        className="rounded-small shadow-elevation-2 flex w-full flex-col gap-7 overflow-clip bg-white px-7 py-5"
      >
        <label htmlFor="draft-prompt" className="sr-only">
          만들고 싶은 사이트 설명
        </label>
        <textarea
          id="draft-prompt"
          rows={1}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Ex. 노트핏, 팀 회의록 SaaS를 소개하는 깔끔한 랜딩 페이지"
          className="text-ink-900 placeholder:text-ink-300 field-sizing-content max-h-60 w-full resize-none leading-[normal] font-medium outline-none"
        />
        <div className="flex w-full items-center justify-between">
          <button type="button" aria-label="파일 첨부" className="shrink-0">
            <Image src={plusIcon} alt="" unoptimized />
          </button>
          <button
            type="submit"
            aria-label="초안 만들기"
            disabled={!trimmed || disabled}
            className="flex size-8 shrink-0 items-center justify-center"
          >
            <Image src={submitArrowIcon} alt="" unoptimized className="-scale-y-100" />
          </button>
        </div>
      </form>

      <div className="flex flex-col items-center gap-6">
        <p className="text-ink-warm text-[12.5px] leading-[normal]">이렇게 시작해 보세요</p>
        <ul className="flex flex-wrap justify-center gap-[15px]">
          {EXAMPLES.map((example) => (
            <li key={example}>
              <button
                type="button"
                onClick={() => setPrompt(example)}
                disabled={disabled}
                className="border-chip-line text-chip-text rounded-full border-[0.55px] bg-white px-2 py-1.5 text-sm leading-[normal] whitespace-nowrap"
              >
                {example}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default DraftPromptForm;
