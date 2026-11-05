'use client';

import { type ReactNode, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { isSiteType, type SiteType, useGetProject, useGetProjectDraft } from '@/entities/project';
import { can } from '@/entities/user';
import { DownloadDraftButton } from '@/features/download-draft';
import { usePutProjectDraft } from '@/features/generate-draft';
import { formatRelativeTime } from '@/shared/lib';

import DraftComposer from './DraftComposer';

interface ProjectDraftProps {
  projectId: number;
}

/** 이미 있는 프로젝트에 초안을 생성합니다. 초안이 있으면 덮어쓰기 전에 확인합니다. */
const ProjectDraft = ({ projectId }: ProjectDraftProps) => {
  const router = useRouter();
  const project = useGetProject(projectId);
  const draft = useGetProjectDraft(projectId);
  const putDraft = usePutProjectDraft();
  // 고르기 전에는 기존 초안의 유형을 기본값으로 씁니다.
  const [pickedSiteType, setPickedSiteType] = useState<SiteType | null | undefined>();
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  const viewerHref = `/projects/${projectId}/viewer`;

  if (project.isPending) {
    return <StatusMessage>프로젝트를 불러오고 있어요.</StatusMessage>;
  }
  if (project.isError) {
    return (
      <StatusMessage role="alert">
        프로젝트를 불러오지 못했어요.{' '}
        <button type="button" className="underline" onClick={() => project.refetch()}>
          다시 시도
        </button>
      </StatusMessage>
    );
  }

  if (!can(project.data.my_role, 'generate-draft')) {
    return (
      <StatusMessage>
        <span className="text-ink block text-lg font-bold">초안은 고객만 만들 수 있어요.</span>
        {draft.data ? (
          <>
            고객이 만든 초안이 있어요.{' '}
            <Link href={viewerHref} className="text-ink font-semibold underline">
              작업 화면에서 보기
            </Link>
            <DownloadDraftButton
              projectId={projectId}
              className="bg-ink hover:bg-ink mt-1 h-10 border-transparent px-4 text-white"
            />
          </>
        ) : (
          '고객이 초안을 만들면 작업 화면에서 확인할 수 있어요.'
        )}
      </StatusMessage>
    );
  }

  const draftSiteType = draft.data?.site_type;
  const existingSiteType = isSiteType(draftSiteType) ? draftSiteType : null;
  const siteType = pickedSiteType === undefined ? existingSiteType : pickedSiteType;
  // 초안이 없다고 확인된 경우(`null`)에만 바로 만들고, 그 밖에는 덮어쓰기를 확인합니다.
  const needsConfirm = draft.data !== null;

  const generate = (prompt: string) => {
    setPendingPrompt(null);
    putDraft.mutate(
      { projectId, prompt, ...(siteType && { site_type: siteType }) },
      { onSuccess: () => router.push(viewerHref) },
    );
  };

  const handleSubmit = (prompt: string) => {
    putDraft.reset();
    if (needsConfirm) setPendingPrompt(prompt);
    else generate(prompt);
  };

  return (
    <DraftComposer
      description={
        <>
          <strong className="text-ink">{project.data.name}</strong> 프로젝트에서 원하는 사이트를
          설명해 주시면, 화면 구조와 기획 초안을 먼저 정리해 드릴게요.
        </>
      }
      siteType={siteType}
      onSiteTypeChange={setPickedSiteType}
      onSubmit={handleSubmit}
      isPending={putDraft.isPending}
      isDone={putDraft.isSuccess}
      disabled={draft.isPending}
      error={putDraft.error}
      header={
        draft.data && (
          <p className="bg-stage text-text rounded-full px-4 py-2 text-sm">
            이미 만든 초안이 있어요 · {formatRelativeTime(draft.data.updated_at)}{' '}
            <Link href={viewerHref} className="text-ink font-semibold underline">
              작업 화면에서 보기
            </Link>
            {' · '}
            <DownloadDraftButton projectId={projectId} variant="link" />
          </p>
        )
      }
      footer={
        pendingPrompt !== null &&
        !putDraft.isPending && (
          <div
            role="alertdialog"
            aria-labelledby="draft-overwrite-title"
            className="border-divider flex w-full flex-col gap-3 rounded-2xl border p-5"
          >
            <p id="draft-overwrite-title" className="text-sm font-semibold">
              다시 만들면 기존 초안을 덮어써요. 이전 초안은 되돌릴 수 없어요.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingPrompt(null)}
                className="border-field hover:border-ink h-9 rounded-[10px] border px-4 text-sm font-semibold"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => generate(pendingPrompt)}
                className="bg-ink h-9 rounded-[10px] px-4 text-sm font-semibold text-white"
              >
                덮어쓰고 만들기
              </button>
            </div>
          </div>
        )
      }
    />
  );
};

const StatusMessage = ({ children, role }: { children: ReactNode; role?: 'alert' }) => (
  <main
    role={role}
    className="text-muted flex min-w-0 flex-1 flex-col items-center justify-center gap-2 bg-white px-8 text-center text-sm"
  >
    {children}
  </main>
);

export default ProjectDraft;
