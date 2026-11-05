'use client';

import { useRef, useState } from 'react';

import { SITE_TYPE_LABEL, type SiteType, usePostProject } from '@/entities/project';
import { usePutProjectDraft } from '@/features/generate-draft';
import { TopBar } from '@/widgets/top-bar';

import { useDraftFlow } from '../model/use-draft-flow';
import DraftComposer from './DraftComposer';
import DraftProgress from './DraftProgress';
import DraftResult from './DraftResult';

/** 새 프로젝트를 만들면서 초안을 생성합니다. (홈 화면) */
const NewProjectDraft = () => {
  const postProject = usePostProject();
  const putDraft = usePutProjectDraft();
  const [siteType, setSiteType] = useState<SiteType>('shop');
  const [projectName, setProjectName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [title, setTitle] = useState('새 프로젝트');
  const promptRef = useRef<HTMLTextAreaElement>(null);
  // 초안 생성이 실패해도 프로젝트는 이미 만들어졌으므로, 다시 시도할 때 같은 프로젝트를 씁니다.
  const [projectId, setProjectId] = useState<number | null>(null);

  const flow = useDraftFlow(async () => {
    const id = projectId ?? (await postProject.mutateAsync({ name: projectName.trim() })).id;
    setProjectId(id);
    await putDraft.mutateAsync({ projectId: id, prompt: prompt.trim(), site_type: siteType });
  });

  const start = () => {
    setTitle(projectName.trim());
    flow.start();
  };

  const backToInput = () => {
    flow.backToInput();
    // 입력 화면이 다시 그려진 뒤에 설명 칸으로 포커스를 옮깁니다.
    requestAnimationFrame(() => promptRef.current?.focus());
  };

  return (
    <>
      <TopBar title={title} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {flow.step === 'input' && (
          <DraftComposer
            projectName={projectName}
            onProjectNameChange={projectId === null ? setProjectName : undefined}
            prompt={prompt}
            onPromptChange={setPrompt}
            siteType={siteType}
            onSiteTypeChange={setSiteType}
            onSubmit={start}
            promptRef={promptRef}
          />
        )}
        {flow.step === 'making' && (
          <DraftProgress
            key={flow.attempt}
            siteTypeLabel={SITE_TYPE_LABEL[siteType]}
            status={flow.status}
            onBack={backToInput}
            onRetry={flow.start}
          />
        )}
        {flow.step === 'done' && projectId !== null && (
          <DraftResult projectId={projectId} prompt={prompt.trim()} onRemake={backToInput} />
        )}
      </div>
    </>
  );
};

export default NewProjectDraft;
