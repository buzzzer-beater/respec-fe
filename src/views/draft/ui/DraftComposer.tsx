'use client';

import { type ReactNode, useState } from 'react';

import type { SiteType } from '@/entities/project';
import { DraftPromptForm, SiteTypeSelect } from '@/features/generate-draft';
import type { ApiError } from '@/shared/api';
import { cn } from '@/shared/lib';
import { Button } from '@/shared/ui';

import { toDraftErrorMessage } from '../model/error';
import DraftProgress from './DraftProgress';

interface DraftComposerProps {
  siteType: SiteType | null;
  onSiteTypeChange: (value: SiteType | null) => void;
  onSubmit: (prompt: string) => void;
  /** 실패 후 "다시 시도". 없으면 `onSubmit`을 씁니다(덮어쓰기 확인을 건너뛸 때 따로 넘깁니다). */
  onRetry?: (prompt: string) => void;
  /** 생성 중에는 입력 화면 대신 진행 화면을 보여 줍니다. */
  isPending: boolean;
  /** 새 프로젝트를 만들면서 생성할 때만 넘깁니다. 진행 화면에 프로젝트 만들기 단계를 붙입니다. */
  projectStep?: 'pending' | 'done';
  /** 다 만든 뒤 보여 줄 결과 화면. 있으면 입력 화면은 숨기기만 해서 "다시 만들기"에 내용이 남습니다. */
  result?: ReactNode;
  /** 입력은 막지만 생성 중 안내는 보이지 않습니다. (기존 초안 확인 중 등) */
  disabled?: boolean;
  error: ApiError | null;
  /** 폼 위 안내 (기존 초안 등) */
  header?: ReactNode;
  /** 폼 아래 안내 (덮어쓰기 확인 등) */
  footer?: ReactNode;
}

// 초안 생성 화면의 제목, 사이트 유형, 설명 입력, 진행/오류 안내를 묶습니다.
const DraftComposer = ({
  siteType,
  onSiteTypeChange,
  onSubmit,
  onRetry,
  isPending,
  projectStep,
  result,
  disabled = false,
  error,
  header,
  footer,
}: DraftComposerProps) => {
  const [submittedPrompt, setSubmittedPrompt] = useState<string | null>(null);
  // 실패 안내에서 "내용 고치기"를 누르면 입력 화면으로 돌아갑니다.
  const [isEditing, setIsEditing] = useState(false);
  const showFailure = !!error && !isPending && !isEditing;
  const showResult = !!result && !isPending;

  const handleSubmit = (prompt: string) => {
    setSubmittedPrompt(prompt);
    setIsEditing(false);
    onSubmit(prompt);
  };

  const handleRetry = () => {
    if (!submittedPrompt) return;
    setIsEditing(false);
    (onRetry ?? onSubmit)(submittedPrompt);
  };

  return (
    <main
      className={cn(
        'flex min-h-0 min-w-0 flex-1 flex-col items-center overflow-y-auto bg-white px-5 sm:px-8',
        showResult ? 'justify-start lg:px-10' : 'justify-center',
      )}
    >
      {isPending && <DraftProgress prompt={submittedPrompt} projectStep={projectStep} />}
      {showResult && result}
      {showFailure && (
        <div
          role="alert"
          className="text-warn flex w-full max-w-md flex-col gap-2 rounded-2xl bg-[#fff4e8] p-5"
        >
          <b className="text-base">초안을 만들지 못했어요</b>
          <span className="text-sm leading-relaxed">
            {toDraftErrorMessage(error)} 적어 둔 내용은 그대로 있어요.
          </span>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsEditing(true)} className="bg-white">
              내용 고치기
            </Button>
            <Button onClick={handleRetry} disabled={!submittedPrompt}>
              다시 시도
            </Button>
          </div>
        </div>
      )}
      {/* 실패하거나 다시 만들 때 쓰던 내용을 그대로 쓸 수 있도록 입력 화면은 숨기기만 합니다. */}
      <div
        hidden={isPending || showResult || showFailure}
        className="flex w-full max-w-2xl flex-col items-center gap-10 py-10 pb-20"
      >
        <h1 className="text-[28px] font-extrabold tracking-[-0.02em] whitespace-nowrap sm:text-[40px]">
          어떤 사이트를 만들까요?
        </h1>
        {header}
        <SiteTypeSelect
          value={siteType}
          onChange={onSiteTypeChange}
          disabled={isPending || disabled}
        />
        <DraftPromptForm onSubmit={handleSubmit} disabled={isPending || disabled} />
        {footer}
      </div>
    </main>
  );
};

export default DraftComposer;
