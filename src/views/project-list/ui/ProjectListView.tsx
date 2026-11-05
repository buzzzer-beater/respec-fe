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
  const [search, setSearch] = useState('');
  const query = search.trim().toLowerCase();
  const visibleProjects = (projects.data ?? []).filter(
    (project) => !query || project.name.toLowerCase().includes(query),
  );

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
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-9 sm:px-10">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-[22px] font-extrabold">내 프로젝트</h1>
          {projects.data && (
            <p className="text-muted text-sm">
              전체 <strong className="text-ink">{projects.data.length}</strong>개
            </p>
          )}
          <label className="border-divider focus-within:border-ink ml-auto flex h-10 w-[240px] max-w-full items-center rounded-[10px] border px-3 transition-colors">
            <span className="sr-only">프로젝트 검색</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="프로젝트 검색"
              className="min-w-0 flex-1 outline-none"
            />
          </label>
          {createButton}
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
        ) : visibleProjects.length === 0 ? (
          <p className="text-muted py-10 text-center text-sm">찾는 프로젝트가 없어요.</p>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-4">
            {visibleProjects.map((project) => (
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
