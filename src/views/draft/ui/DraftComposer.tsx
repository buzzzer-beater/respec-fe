'use client';

import type { FormEvent, ReactNode, RefObject } from 'react';

import type { SiteType } from '@/entities/project';
import { DraftPromptForm, SiteTypeSelect } from '@/features/generate-draft';

interface DraftComposerProps {
  projectName: string;
  /** 없으면 이름을 바꿀 수 없습니다(이미 만든 프로젝트). */
  onProjectNameChange?: (value: string) => void;
  prompt: string;
  onPromptChange: (value: string) => void;
  siteType: SiteType;
  onSiteTypeChange: (value: SiteType) => void;
  onSubmit: () => void;
  /** 입력은 막지만 생성 중 안내는 보이지 않습니다. (기존 초안 확인 중 등) */
  disabled?: boolean;
  promptRef?: RefObject<HTMLTextAreaElement | null>;
  /** 폼 아래 안내 (덮어쓰기 확인 등) */
  footer?: ReactNode;
}

/** demo-design `.step-input`: 왼쪽은 이름과 설명(넓게), 오른쪽은 사이트 유형(회색 상자) */
const DraftComposer = ({
  projectName,
  onProjectNameChange,
  prompt,
  onPromptChange,
  siteType,
  onSiteTypeChange,
  onSubmit,
  disabled = false,
  promptRef,
  footer,
}: DraftComposerProps) => {
  const canSubmit = !!prompt.trim() && !!projectName.trim() && !disabled;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canSubmit) onSubmit();
  };

  // 예시를 누르면 설명을 채우고, 이름이 비어 있으면 첫 쉼표 앞을 이름으로 씁니다.
  const handlePickExample = (example: string) => {
    onPromptChange(example);
    if (!projectName && onProjectNameChange) onProjectNameChange(example.split(',')[0] ?? example);
    promptRef?.current?.focus();
  };

  return (
    <section
      aria-label="초안 정보 입력"
      className="flex animate-[pop-in_0.4s_var(--ease-out-soft)] flex-col items-center px-5 pt-11 pb-14 sm:px-10"
    >
      <form
        onSubmit={handleSubmit}
        className="grid w-[min(1200px,100%)] grid-cols-1 gap-x-8 gap-y-7 min-[961px]:grid-cols-[minmax(0,1fr)_360px]"
      >
        <h2 className="col-span-full text-[32px] font-extrabold tracking-[-0.02em]">
          어떤 사이트를 만들까요?
        </h2>
        <div className="grid min-w-0 content-start gap-6">
          <div className="grid gap-3">
            <label htmlFor="draft-name" className="text-base font-extrabold">
              프로젝트 이름
            </label>
            <input
              id="draft-name"
              value={projectName}
              onChange={(event) => onProjectNameChange?.(event.target.value)}
              readOnly={!onProjectNameChange}
              disabled={disabled}
              placeholder="예) MORROW 쇼핑몰"
              maxLength={40}
              autoComplete="off"
              className="border-field focus:border-ink read-only:bg-hover read-only:text-text h-[52px] w-full rounded-xl border px-4 text-base transition-colors duration-200 outline-none"
            />
          </div>
          <DraftPromptForm
            value={prompt}
            onChange={onPromptChange}
            onPickExample={handlePickExample}
            onSubmit={onSubmit}
            canSubmit={canSubmit}
            disabled={disabled}
            textareaRef={promptRef}
          />
          {footer}
        </div>
        <aside className="bg-stage self-start rounded-2xl p-5">
          <SiteTypeSelect value={siteType} onChange={onSiteTypeChange} disabled={disabled} />
        </aside>
      </form>
    </section>
  );
};

export default DraftComposer;
