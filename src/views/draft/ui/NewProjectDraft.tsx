'use client';

import { useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useQueryClient } from '@tanstack/react-query';

import {
  projectQueryKeys,
  SITE_TYPE_LABEL,
  type SiteType,
  usePostProject,
} from '@/entities/project';
import { putProjectDeployment } from '@/features/connect-deployment';
import { usePutProjectDraft } from '@/features/generate-draft';
import { TopBar } from '@/widgets/top-bar';

import { DEMO_DEPLOYMENT_URL, DEMO_MAKING_DELAY_MS, isDemoPrompt } from '../model/demo-trigger';
import { useDraftFlow } from '../model/use-draft-flow';
import DraftComposer from './DraftComposer';
import DraftProgress from './DraftProgress';
import DraftResult from './DraftResult';

/** 새 프로젝트를 만들면서 초안을 생성합니다. (홈 화면) */
const NewProjectDraft = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const postProject = usePostProject();
  const putDraft = usePutProjectDraft();
  const [siteType, setSiteType] = useState<SiteType>('shop');
  const [projectName, setProjectName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [title, setTitle] = useState('새 프로젝트');
  const promptRef = useRef<HTMLTextAreaElement>(null);
  // 초안 생성이 실패해도 프로젝트는 이미 만들어졌으므로, 다시 시도할 때 같은 프로젝트를 씁니다.
  const [projectId, setProjectId] = useState<number | null>(null);
  // 시연용: 초안 대신 배포 사이트를 연결한 경우 결과 화면 대신 작업 화면으로 보냅니다.
  const [isDemo, setIsDemo] = useState(false);

  const flow = useDraftFlow(async () => {
    const id = projectId ?? (await postProject.mutateAsync({ name: projectName.trim() })).id;
    setProjectId(id);
    if (isDemoPrompt(prompt)) {
      setIsDemo(true);
      await Promise.all([
        putProjectDeployment(id, { deployment_url: DEMO_DEPLOYMENT_URL }),
        new Promise((resolve) => setTimeout(resolve, DEMO_MAKING_DELAY_MS)),
      ]);
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.all() });
      return;
    }
    setIsDemo(false);
    await putDraft.mutateAsync({ projectId: id, prompt: prompt.trim(), site_type: siteType });
  });

  useEffect(() => {
    if (flow.step === 'done' && isDemo && projectId !== null)
      router.replace(`/projects/${projectId}/viewer?site=deployed`);
  }, [flow.step, isDemo, projectId, router]);

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
        {flow.step === 'done' && !isDemo && projectId !== null && (
          <DraftResult projectId={projectId} prompt={prompt.trim()} onRemake={backToInput} />
        )}
      </div>
    </>
  );
};

export default NewProjectDraft;
