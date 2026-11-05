'use client';

import { type KeyboardEvent, type RefObject } from 'react';

/** 설명은 500자까지 받습니다. */
export const DRAFT_PROMPT_MAX_LENGTH = 500;

const EXAMPLES = [
  '신발 편집숍, 사진이 크게 보이게',
  '동네 카페 예약, 따뜻한 느낌',
  '필라테스 스튜디오 소개와 수업 안내',
];

interface DraftPromptFormProps {
  value: string;
  onChange: (value: string) => void;
  /** 예시를 누르면 설명을 채우고, 프로젝트 이름이 비어 있으면 첫 쉼표 앞을 이름으로 씁니다. */
  onPickExample: (example: string) => void;
  /** Enter로 보낼 때. 보낼 수 없으면 부르지 않습니다. */
  onSubmit: () => void;
  canSubmit: boolean;
  disabled?: boolean;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
}

/** demo-design `.composer` + `.examples`: 원하는 방향을 적는 칸과 예시 */
const DraftPromptForm = ({
  value,
  onChange,
  onPickExample,
  onSubmit,
  canSubmit,
  disabled = false,
  textareaRef,
}: DraftPromptFormProps) => {
  // Enter로 만들고 Shift+Enter로 줄바꿈합니다. 한글 조합 중 Enter는 무시합니다.
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (canSubmit) onSubmit();
  };

  return (
    <div className="grid gap-3">
      <label htmlFor="draft-prompt" className="flex items-baseline gap-2 text-base font-extrabold">
        원하는 방향{' '}
        <em className="text-faint text-[13px] font-semibold not-italic">
          자세할수록 초안이 정확해요
        </em>
      </label>
      <div className="border-field focus-within:border-ink grid gap-3 rounded-2xl border pt-[18px] pr-[18px] pb-3.5 pl-5 transition-colors duration-200">
        <textarea
          ref={textareaRef}
          id="draft-prompt"
          value={value}
          onChange={(event) => onChange(event.target.value.slice(0, DRAFT_PROMPT_MAX_LENGTH))}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="예) 신발 편집숍이에요. 상품 사진이 크게 보이고, 사이즈를 고르기 쉬웠으면 좋겠어요."
          className="placeholder:text-faint min-h-[200px] w-full resize-none text-base leading-[1.6] outline-none"
        />
        <div className="flex items-center gap-2.5">
          <span className="text-faint text-xs">
            {value.length} / {DRAFT_PROMPT_MAX_LENGTH}
          </span>
          <button
            type="submit"
            disabled={!canSubmit || disabled}
            className="bg-ink hover:bg-ink-hover disabled:bg-divider disabled:text-faint ease-spring ml-auto inline-flex h-11 items-center rounded-xl px-5 text-sm font-semibold text-white transition-[transform,background-color] duration-300 active:scale-[0.96] disabled:cursor-default"
          >
            초안 만들기
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className="text-muted mr-1 self-center text-[13px]">이렇게 시작해 보세요</span>
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => onPickExample(example)}
            disabled={disabled}
            className="border-field text-text hover:border-ink h-[30px] rounded-full border bg-white px-3 text-[13px] whitespace-nowrap transition-colors duration-200"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DraftPromptForm;
