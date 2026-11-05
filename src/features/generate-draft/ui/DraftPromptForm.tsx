'use client';

import { type FormEvent, type KeyboardEvent, useState } from 'react';

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
    <div className="flex w-full flex-col items-center gap-5">
      <form
        onSubmit={handleSubmit}
        className="border-field focus-within:border-ink flex w-full flex-col gap-6 rounded-2xl border bg-white px-6 pt-5 pb-4 transition-colors"
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
          className="text-ink placeholder:text-faint field-sizing-content max-h-60 min-h-12 w-full resize-none text-base leading-normal outline-none"
        />
        {/* 파일 첨부는 백엔드 업로드 API가 없어 숨겼습니다. (#52) */}
        <div className="flex w-full items-center justify-end">
          <button
            type="submit"
            aria-label="초안 만들기"
            disabled={!trimmed || disabled}
            className="bg-ink disabled:bg-divider grid size-9 shrink-0 place-items-center rounded-[10px] text-white transition-transform active:scale-90"
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
        </div>
      </form>

      <div className="flex flex-col items-center gap-3">
        <p className="text-muted text-[13px]">이렇게 시작해 보세요</p>
        <ul className="flex flex-wrap justify-center gap-1.5">
          {EXAMPLES.map((example) => (
            <li key={example}>
              <button
                type="button"
                onClick={() => setPrompt(example)}
                disabled={disabled}
                className="border-field text-text hover:border-ink h-[30px] rounded-full border bg-white px-3 text-[13px] whitespace-nowrap transition-colors"
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
