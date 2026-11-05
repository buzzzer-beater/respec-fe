'use client';

import { useState } from 'react';

import { type SiteType, usePostProject } from '@/entities/project';
import { usePutProjectDraft } from '@/features/generate-draft';
import { Input } from '@/shared/ui';

import DraftComposer from './DraftComposer';
import DraftResult from './DraftResult';

const PROJECT_NAME_MAX = 40;

// 이름을 비워 두면 설명의 첫 줄을 이름으로 씁니다.
const toProjectName = (prompt: string) => {
  const firstLine = prompt.split('\n')[0].trim();
  return firstLine.length > PROJECT_NAME_MAX
    ? `${firstLine.slice(0, PROJECT_NAME_MAX)}…`
    : firstLine;
};

/** 새 프로젝트를 만들면서 초안을 생성합니다. (홈 화면) */
const NewProjectDraft = () => {
  const postProject = usePostProject();
  const putDraft = usePutProjectDraft();
  const [name, setName] = useState('');
  const [siteType, setSiteType] = useState<SiteType | null>(null);
  const [submittedPrompt, setSubmittedPrompt] = useState<string | null>(null);
  // 초안 생성이 실패해도 프로젝트는 이미 만들어졌으므로, 다시 시도할 때 같은 프로젝트를 씁니다.
  const [projectId, setProjectId] = useState<number | null>(null);

  const isPending = postProject.isPending || putDraft.isPending;
  const error = postProject.error ?? putDraft.error;

  const handleSubmit = async (prompt: string) => {
    postProject.reset();
    putDraft.reset();
    setSubmittedPrompt(prompt);
    try {
      const id =
        projectId ??
        (await postProject.mutateAsync({ name: name.trim() || toProjectName(prompt) })).id;
      setProjectId(id);
      await putDraft.mutateAsync({
        projectId: id,
        prompt,
        ...(siteType && { site_type: siteType }),
      });
    } catch {
      // 오류는 mutation 상태로 화면에 보여 줍니다.
    }
  };

  return (
    <DraftComposer
      siteType={siteType}
      onSiteTypeChange={setSiteType}
      onSubmit={handleSubmit}
      isPending={isPending}
      projectStep={postProject.isPending ? 'pending' : 'done'}
      result={
        putDraft.isSuccess && projectId !== null ? (
          <DraftResult
            projectId={projectId}
            prompt={submittedPrompt}
            onRemake={() => putDraft.reset()}
          />
        ) : undefined
      }
      error={error}
      header={
        // 프로젝트를 만든 뒤(초안만 다시 만들 때)는 이름을 바꾸지 않습니다.
        <div className="flex w-full flex-col gap-2">
          <label htmlFor="project-name" className="text-sm font-bold">
            프로젝트 이름
          </label>
          <Input
            id="project-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={PROJECT_NAME_MAX}
            placeholder="예) MORROW 쇼핑몰"
            autoComplete="off"
            disabled={isPending || projectId !== null}
          />
          <p className="text-muted text-xs">비워 두면 설명의 첫 줄을 이름으로 써요.</p>
        </div>
      }
    />
  );
};

export default NewProjectDraft;
