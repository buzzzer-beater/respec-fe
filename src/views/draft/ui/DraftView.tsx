'use client';

import { useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { usePostProject } from '@/entities/project';
import { DraftPromptForm, usePutProjectDraft } from '@/features/generate-draft';
import type { ApiError } from '@/shared/api';

import logoMarkLarge from '../assets/logo-mark-large.svg';

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
    <main className="shadow-elevation-2 flex h-full min-w-0 flex-1 flex-col items-center justify-center overflow-y-auto bg-white px-8">
      <div className="flex w-full max-w-3xl flex-col items-center gap-15 pb-20">
        <Image src={logoMarkLarge} alt="" unoptimized priority />
        <div className="flex flex-col items-center gap-2.5 leading-[normal]">
          <h1 className="text-[56px] font-semibold whitespace-nowrap text-black">
            어떤 사이트를 만들까요?
          </h1>
          <p className="text-ink-400 w-min min-w-full text-center text-xl">
            프로젝트 이름과 원하는 방향을 알려주시면, 화면 구조와 기획 초안을 먼저 정리해 드릴게요.
          </p>
        </div>
        <DraftPromptForm onSubmit={handleSubmit} disabled={isPending} />
        {isPending && (
          <p role="status" className="text-ink-450 text-sm">
            초안을 만들고 있어요. 최대 2분 정도 걸릴 수 있어요.
          </p>
        )}
        {error && !isPending && (
          <p role="alert" className="text-danger text-sm">
            {toMessage(error)}
          </p>
        )}
      </div>
    </main>
  );
};

export default DraftView;
