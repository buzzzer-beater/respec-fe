'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { type Project, useGetProjects } from '@/entities/project';
import { CreateProjectDialog } from '@/features/create-project';

import ProjectCard from './ProjectCard';

const ProjectListView = () => {
  const router = useRouter();
  const projects = useGetProjects();
  const [isCreating, setIsCreating] = useState(false);

  // 프로젝트를 만들면 바로 초안 생성으로 이어집니다.
  const handleCreated = (project: Project) => {
    setIsCreating(false);
    router.push(`/projects/${project.id}/draft`);
  };

  const createButton = (
    <button
      type="button"
      onClick={() => setIsCreating(true)}
      className="bg-ink h-10 shrink-0 rounded-[10px] px-4 text-sm font-semibold text-white"
    >
      새 프로젝트
    </button>
  );

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-10 py-9">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-[22px] font-extrabold">내 프로젝트</h1>
          {projects.data && (
            <p className="text-muted text-sm">
              전체 <strong className="text-ink">{projects.data.length}</strong>개
            </p>
          )}
          <div className="ml-auto">{createButton}</div>
        </div>

        {projects.isPending ? (
          <p role="status" className="text-muted text-sm">
            프로젝트를 불러오고 있어요.
          </p>
        ) : projects.isError ? (
          <p role="alert" className="text-sm">
            프로젝트를 불러오지 못했어요.{' '}
            <button type="button" className="underline" onClick={() => projects.refetch()}>
              다시 시도
            </button>
          </p>
        ) : projects.data.length === 0 ? (
          <div className="bg-stage flex flex-col items-center gap-3 rounded-2xl px-8 py-16 text-center">
            <p className="text-lg font-bold">아직 참여 중인 프로젝트가 없어요.</p>
            <p className="text-muted text-sm leading-relaxed">
              새 프로젝트를 만들고 AI 초안부터 시작해 보세요.
              <br />
              개발자라면 고객에게 받은 초대 링크로 참여할 수 있어요.
            </p>
            <div className="mt-2">{createButton}</div>
          </div>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
            {projects.data.map((project) => (
              <li key={project.id}>
                <ProjectCard project={project} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {isCreating && (
        <CreateProjectDialog onClose={() => setIsCreating(false)} onCreated={handleCreated} />
      )}
    </main>
  );
};

export default ProjectListView;
