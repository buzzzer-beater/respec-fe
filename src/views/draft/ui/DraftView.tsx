'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { usePostProject } from '@/entities/project';
import { DraftPromptForm, usePutProjectDraft } from '@/features/generate-draft';
import type { ApiError } from '@/shared/api';

const PROJECT_NAME_MAX = 40;

// 디자인에 프로젝트 이름 입력칸이 없어서 설명의 첫 줄을 이름으로 씁니다.
const toProjectName = (prompt: string) => {
  const firstLine = prompt.split('\n')[0].trim();
  return firstLine.length > PROJECT_NAME_MAX
    ? `${firstLine.slice(0, PROJECT_NAME_MAX)}…`
    : firstLine;
};

const toMessage = (error: ApiError) => {
  if (error.code === 'DRAFT_GENERATION_FAILED')
    return '초안을 만들지 못했어요. 다시 시도해 주세요.';
  if (error.code === 'TIMEOUT' || error.status === 502 || error.status === 504) {
    return '초안 생성 시간이 너무 오래 걸렸어요. 다시 시도해 주세요.';
  }
  return error.message;
};

const DraftView = () => {
  const router = useRouter();
  const postProject = usePostProject();
  const putDraft = usePutProjectDraft();
  // 초안 생성이 실패해도 프로젝트는 이미 만들어졌으므로, 다시 시도할 때 같은 프로젝트를 씁니다.
  const [projectId, setProjectId] = useState<number | null>(null);

  const isPending = postProject.isPending || putDraft.isPending;
  const error = postProject.error ?? putDraft.error;

  const handleSubmit = async (prompt: string) => {
    postProject.reset();
    putDraft.reset();
    try {
      const id = projectId ?? (await postProject.mutateAsync({ name: toProjectName(prompt) })).id;
      setProjectId(id);
      await putDraft.mutateAsync({ projectId: id, prompt });
      router.push(`/projects/${id}/viewer`);
    } catch {
      // 오류는 mutation 상태로 화면에 보여 줍니다.
    }
  };

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center overflow-y-auto bg-white px-8">
      <div className="flex w-full max-w-2xl flex-col items-center gap-10 pb-20">
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-[40px] font-extrabold tracking-[-0.02em] whitespace-nowrap">
            어떤 사이트를 만들까요?
          </h1>
          <p className="text-muted w-min min-w-full text-center text-base leading-relaxed">
            프로젝트 이름과 원하는 방향을 알려주시면, 화면 구조와 기획 초안을 먼저 정리해 드릴게요.
          </p>
        </div>
        <DraftPromptForm onSubmit={handleSubmit} disabled={isPending} />
        {isPending && (
          <p role="status" className="text-muted text-sm">
            초안을 만들고 있어요. 최대 2분 정도 걸릴 수 있어요.
          </p>
        )}
        {error && !isPending && (
          <p role="alert" className="text-warn text-sm font-semibold">
            {toMessage(error)}
          </p>
        )}
      </div>
    </main>
  );
};

export default DraftView;
