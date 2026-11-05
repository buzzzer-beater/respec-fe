'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { type SiteType, usePostProject } from '@/entities/project';
import { usePutProjectDraft } from '@/features/generate-draft';

import DraftComposer from './DraftComposer';

/** 새 프로젝트를 만들면서 초안을 생성합니다. (홈 화면) */
const NewProjectDraft = () => {
  const router = useRouter();
  const postProject = usePostProject();
  const putDraft = usePutProjectDraft();
  const [siteType, setSiteType] = useState<SiteType | null>('shop');
  const [projectName, setProjectName] = useState('');
  // 초안 생성이 실패해도 프로젝트는 이미 만들어졌으므로, 다시 시도할 때 같은 프로젝트를 씁니다.
  const [projectId, setProjectId] = useState<number | null>(null);

  const isPending = postProject.isPending || putDraft.isPending;
  const error = postProject.error ?? putDraft.error;

  const handleSubmit = async (prompt: string) => {
    postProject.reset();
    putDraft.reset();
    try {
      const id =
        projectId ??
        (await postProject.mutateAsync({ name: projectName.trim() || '새 프로젝트' })).id;
      setProjectId(id);
      await putDraft.mutateAsync({
        projectId: id,
        prompt,
        ...(siteType && { site_type: siteType }),
      });
      router.push(`/projects/${id}/viewer`);
    } catch {
      // 오류는 mutation 상태로 화면에 보여 줍니다.
    }
  };

  return (
    <DraftComposer
      description="프로젝트 이름과 원하는 방향을 알려주시면, 화면 구조와 기획 초안을 먼저 정리해 드릴게요."
      projectName={projectName}
      onProjectNameChange={setProjectName}
      siteType={siteType}
      onSiteTypeChange={setSiteType}
      onSubmit={handleSubmit}
      isPending={isPending}
      projectStep={postProject.isPending ? 'pending' : 'done'}
      isDone={putDraft.isSuccess}
      error={error}
    />
  );
};

export default NewProjectDraft;
