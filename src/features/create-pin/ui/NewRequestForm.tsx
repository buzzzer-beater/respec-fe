'use client';

import { type KeyboardEvent, useRef, useState } from 'react';

import { PIN_SOURCE_LABEL, PinNumberBadge, type PinSource, toPageLabel } from '@/entities/pin';
import { shake } from '@/shared/lib';
import { Button } from '@/shared/ui';

/** 무엇을 적을지 막막할 때 누르면 입력칸에 넣어 주는 예시 */
const EXAMPLES = ['색을 바꾸고 싶어요', '글자가 잘 안 보여요', '더 크게 해 주세요'];

interface NewRequestFormProps {
  /** 저장하면 받을 핀 번호 */
  pinNumber: number;
  /** 핀을 찍은 사이트와 페이지 */
  source: PinSource;
  pagePath: string;
  /** 찍은 요소 이름(섹션 이름, `data-respec-id` 등). 모르면 생략합니다. */
  elementLabel?: string | null;
  onSubmit: (content: string) => void;
  onCancel: () => void;
  isPending?: boolean;
  errorMessage?: string | null;
}

/**
 * 오른쪽 패널의 새 요청 입력 (demo-design `renderNew`). 사이트에서 핀 자리를 누르면 열립니다.
 * Ctrl/Cmd+Enter로 보내고, 빈 채로 보내면 입력칸을 흔듭니다.
 * 보낸 뒤 안내("핀 N을 남겼어요 · …")와 상세 열기는 핀을 저장하는 쪽에서 합니다.
 */
const NewRequestForm = ({
  pinNumber,
  source,
  pagePath,
  elementLabel,
  onSubmit,
  onCancel,
  isPending = false,
  errorMessage,
}: NewRequestFormProps) => {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const trimmed = content.trim();
    if (!trimmed) {
      shake(textareaRef.current);
      return;
    }
    if (!isPending) onSubmit(trimmed);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      submit();
    }
  };

  const location = [PIN_SOURCE_LABEL[source], toPageLabel(pagePath), elementLabel]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="flex animate-[slide-in_0.3s_var(--ease-out-soft)] flex-col gap-4">
      <div className="flex items-center gap-3">
        <PinNumberBadge number={pinNumber} filled size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-extrabold">새 요청</h2>
          <p className="text-muted mt-0.5 truncate text-[13px]">{location}</p>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        autoFocus
        rows={5}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="어떤 점을 바꾸고 싶나요? 편하게 말로 적어 주세요."
        aria-label="수정 요청 내용"
        disabled={isPending}
        className="border-field focus:border-ink text-ink placeholder:text-faint w-full resize-none rounded-xl border px-3.5 py-3 text-[15px] leading-[1.55] outline-none"
      />
      <div className="-mt-1.5 flex flex-wrap gap-1.5" aria-label="예시">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            disabled={isPending}
            onClick={() => {
              setContent(example);
              textareaRef.current?.focus();
            }}
            className="border-field text-text hover:border-ink h-[30px] rounded-full border bg-white px-3 text-[13px] transition-colors"
          >
            {example}
          </button>
        ))}
      </div>
      {errorMessage && (
        <p role="alert" className="text-warn text-[13px] font-semibold">
          {errorMessage}
        </p>
      )}
      <div className="flex gap-2">
        <Button variant="secondary" size="lg" onClick={onCancel} className="flex-1">
          취소
        </Button>
        <Button size="lg" onClick={submit} disabled={isPending} className="flex-1">
          {isPending ? '남기는 중…' : '요청 남기기'}
        </Button>
      </div>
    </div>
  );
};

export default NewRequestForm;
