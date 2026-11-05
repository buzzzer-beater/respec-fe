'use client';

import { type ReactNode, useRef, useState } from 'react';

import Link from 'next/link';

import {
  isSiteType,
  SITE_TYPE_LABEL,
  type SiteType,
  useGetProject,
  useGetProjectDraft,
  usePatchProject,
} from '@/entities/project';
import { can } from '@/entities/user';
import { DownloadDraftButton } from '@/features/download-draft';
import { usePutProjectDraft } from '@/features/generate-draft';
import { Button } from '@/shared/ui';

import { useDraftFlow } from '../model/use-draft-flow';
import DraftComposer from './DraftComposer';
import DraftProgress from './DraftProgress';
import DraftResult from './DraftResult';

interface ProjectDraftProps {
  projectId: number;
}

/**
 * 이미 있는 프로젝트에 초안을 생성합니다. 이름을 고쳤으면 초안을 만들기 전에 먼저 저장합니다.
 * 초안이 이미 있으면 덮어쓰기 전에 한 번 확인합니다. 이전 초안은 되돌릴 수 없어서입니다.
 */
const ProjectDraft = ({ projectId }: ProjectDraftProps) => {
  const project = useGetProject(projectId);
  const draft = useGetProjectDraft(projectId);
  const putDraft = usePutProjectDraft();
  const rename = usePatchProject(projectId);
  const [editedName, setEditedName] = useState<string | undefined>();
  // 고르기 전에는 기존 초안의 유형과 설명을 기본값으로 씁니다.
  const [pickedSiteType, setPickedSiteType] = useState<SiteType | undefined>();
  const [editedPrompt, setEditedPrompt] = useState<string | undefined>();
  const [isConfirming, setIsConfirming] = useState(false);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  const draftSiteType = draft.data?.site_type;
  const siteType = pickedSiteType ?? (isSiteType(draftSiteType) ? draftSiteType : 'shop');
  const prompt = editedPrompt ?? draft.data?.prompt ?? '';

  const name = editedName ?? project.data?.name ?? '';

  const flow = useDraftFlow(async () => {
    const nextName = name.trim();
    if (project.data && nextName !== project.data.name)
      await rename.mutateAsync({ name: nextName });
    await putDraft.mutateAsync({ projectId, prompt: prompt.trim(), site_type: siteType });
  });

  if (project.isPending) return <StatusMessage>프로젝트를 불러오고 있어요.</StatusMessage>;
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
            <Link
              href={`/projects/${projectId}/viewer`}
              className="text-ink font-semibold underline"
            >
              작업 화면에서 보기
            </Link>
            <DownloadDraftButton projectId={projectId} className="mt-1" />
          </>
        ) : (
          '고객이 초안을 만들면 작업 화면에서 확인할 수 있어요.'
        )}
      </StatusMessage>
    );
  }

  const handleSubmit = () => {
    if (draft.data) setIsConfirming(true);
    else flow.start();
  };

  const backToInput = () => {
    flow.backToInput();
    requestAnimationFrame(() => promptRef.current?.focus());
  };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      {flow.step === 'input' && (
        <DraftComposer
          projectName={name}
          onProjectNameChange={setEditedName}
          prompt={prompt}
          onPromptChange={setEditedPrompt}
          siteType={siteType}
          onSiteTypeChange={setPickedSiteType}
          onSubmit={handleSubmit}
          disabled={draft.isPending}
          promptRef={promptRef}
          footer={
            isConfirming && (
              <div
                role="alertdialog"
                aria-labelledby="draft-overwrite-title"
                className="bg-warn-soft text-warn-strong grid gap-3 rounded-[14px] p-[18px]"
              >
                <p id="draft-overwrite-title" className="text-sm font-semibold">
                  다시 만들면 지금 초안을 덮어써요. 이전 초안은 되돌릴 수 없어요.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setIsConfirming(false)}
                    className="h-[42px] flex-1"
                  >
                    취소
                  </Button>
                  <Button
                    onClick={() => {
                      setIsConfirming(false);
                      flow.start();
                    }}
                    className="h-[42px] flex-1"
                  >
                    덮어쓰고 만들기
                  </Button>
                </div>
              </div>
            )
          }
        />
      )}
      {flow.step === 'making' && (
        <DraftProgress
          key={flow.attempt}
          siteTypeLabel={SITE_TYPE_LABEL[siteType]}
          status={flow.status}
          onBack={backToInput}
          // 덮어쓰기는 처음 보낼 때 이미 확인했으므로 다시 시도는 바로 만듭니다.
          onRetry={flow.start}
        />
      )}
      {flow.step === 'done' && (
        <DraftResult projectId={projectId} prompt={prompt.trim()} onRemake={backToInput} />
      )}
    </div>
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
