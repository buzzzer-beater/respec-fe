'use client';

import type { ReactNode } from 'react';

import type { SiteType } from '@/entities/project';
import { DraftPromptForm, SiteTypeSelect } from '@/features/generate-draft';
import type { ApiError } from '@/shared/api';

import { toDraftErrorMessage } from '../model/error';

interface DraftComposerProps {
  description: ReactNode;
  siteType: SiteType | null;
  onSiteTypeChange: (value: SiteType | null) => void;
  onSubmit: (prompt: string) => void;
  /** 생성 중에는 입력을 막고 안내를 보여 줍니다. */
  isPending: boolean;
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
  description,
  siteType,
  onSiteTypeChange,
  onSubmit,
  isPending,
  disabled = false,
  error,
  header,
  footer,
}: DraftComposerProps) => {
  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center overflow-y-auto bg-white px-5 sm:px-8">
      <div className="flex w-full max-w-2xl flex-col items-center gap-10 py-10 pb-20">
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-[28px] font-extrabold tracking-[-0.02em] whitespace-nowrap sm:text-[40px]">
            어떤 사이트를 만들까요?
          </h1>
          <p className="text-muted w-min min-w-full text-center text-base leading-relaxed">
            {description}
          </p>
        </div>
        {header}
        <SiteTypeSelect
          value={siteType}
          onChange={onSiteTypeChange}
          disabled={isPending || disabled}
        />
        <DraftPromptForm onSubmit={onSubmit} disabled={isPending || disabled} />
        {footer}
        {isPending && (
          <p role="status" className="text-muted text-sm">
            초안을 만들고 있어요. 최대 2분 정도 걸릴 수 있어요.
          </p>
        )}
        {error && !isPending && (
          <p role="alert" className="text-warn text-sm font-semibold">
            {toDraftErrorMessage(error)}
          </p>
        )}
      </div>
    </main>
  );
};

export default DraftComposer;
