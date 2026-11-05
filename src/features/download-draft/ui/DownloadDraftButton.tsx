'use client';

import { useGetProject, useGetProjectDraft } from '@/entities/project';
import type { ApiError } from '@/shared/api';
import { cn } from '@/shared/lib';

import { useDownloadDraftZip } from '../api/draft-zip';
import { toDraftZipFilename } from '../model/filename';

const VARIANT_CLASS = {
  button:
    'border-divider text-ink hover:bg-hover h-9 rounded-[10px] border px-3.5 text-sm font-semibold',
  link: 'text-ink font-semibold underline',
} as const;

const toErrorMessage = (error: ApiError) => {
  if (error.code === 'DRAFT_NOT_FOUND') return '아직 초안이 없어요.';
  if (error.code === 'TIMEOUT') return '시간이 너무 오래 걸렸어요. 다시 시도해 주세요.';
  return '코드를 내려받지 못했어요. 다시 시도해 주세요.';
};

interface DownloadDraftButtonProps {
  projectId: number;
  /** `button`은 상단바 버튼, `link`는 안내 문장 안의 링크 모양입니다. */
  variant?: keyof typeof VARIANT_CLASS;
  className?: string;
}

/** 초안 코드를 ZIP으로 받습니다. 초안이 없으면 보이지 않습니다. */
const DownloadDraftButton = ({
  projectId,
  variant = 'button',
  className,
}: DownloadDraftButtonProps) => {
  const { data: project } = useGetProject(projectId);
  const { data: draft } = useGetProjectDraft(projectId);
  const download = useDownloadDraftZip(projectId);

  if (!draft) return null;

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => download.mutate(toDraftZipFilename(project?.name))}
        disabled={download.isPending}
        aria-busy={download.isPending}
        className={cn(
          'whitespace-nowrap disabled:cursor-wait disabled:opacity-60',
          VARIANT_CLASS[variant],
          className,
        )}
      >
        {download.isPending ? '내려받는 중…' : '코드 다운로드'}
      </button>
      {download.error && !download.isPending && (
        <span
          role="alert"
          className="text-warn absolute top-full right-0 z-40 mt-2 rounded-[10px] bg-white px-3 py-2 text-[13px] font-semibold whitespace-nowrap shadow-[0_2px_12px_rgba(24,24,27,0.12)]"
        >
          {toErrorMessage(download.error)}
        </span>
      )}
    </span>
  );
};

export default DownloadDraftButton;
