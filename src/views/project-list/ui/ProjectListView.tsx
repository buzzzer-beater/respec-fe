'use client';

import { useState } from 'react';

import Link from 'next/link';

import { useQueries } from '@tanstack/react-query';

import { useGetProjects } from '@/entities/project';
import { changeRequestQueryKeys, getChangeRequests, isMyTurn } from '@/entities/request';
import { buttonClassName, Icon } from '@/shared/ui';

import ProjectCard from './ProjectCard';

/**
 * demo-design `projects.html`. 카드를 누르면 작업 화면, 마지막 칸은 새 프로젝트(초안 생성)입니다.
 * 백엔드에 `my_turn_count`가 없어서 프로젝트마다 요청 목록을 받아 내 차례를 셉니다(카드와 같은 캐시를 씁니다).
 */
const ProjectListView = () => {
  const projects = useGetProjects();
  const [search, setSearch] = useState('');
  const all = projects.data ?? [];
  const query = search.trim().toLowerCase();
  const list = query ? all.filter((project) => project.name.toLowerCase().includes(query)) : all;

  const requestQueries = useQueries({
    queries: all.map((project) => ({
      queryKey: changeRequestQueryKeys.getChangeRequests(project.id),
      queryFn: () => getChangeRequests(project.id),
    })),
  });
  const myTurnByProject = new Map(
    all.map((project, index) => [
      project.id,
      requestQueries[index]?.data?.filter((request) => isMyTurn(request.status, project.my_role))
        .length ?? 0,
    ]),
  );
  const totalMyTurn = [...myTurnByProject.values()].reduce((sum, count) => sum + count, 0);

  return (
    <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-white">
      <title>RE:SPEC — 내 프로젝트</title>
      <div className="mx-auto max-w-[1280px] px-5 pt-12 pb-20 sm:px-10">
        <div className="mb-7 flex flex-wrap items-center gap-3.5">
          <h2 className="text-[28px] font-extrabold tracking-[-0.02em]">프로젝트</h2>
          {projects.data && (
            <span className="text-muted text-sm">
              참여 중 <b className="text-ink">{all.length}</b> · 내 차례 요청{' '}
              <b className="text-ink">{totalMyTurn}</b>
            </span>
          )}
          <span className="flex-1" />
          <label className="border-divider text-muted focus-within:border-ink flex h-10 w-full items-center gap-2 rounded-[10px] border px-3 sm:w-[240px]">
            <Icon name="search" size={15} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="프로젝트 검색"
              aria-label="프로젝트 검색"
              className="text-ink min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </label>
          <Link href="/" className={buttonClassName({ className: 'rounded-xl' })}>
            <Icon name="plus" size={16} />새 프로젝트
          </Link>
        </div>

        {projects.isPending ? (
          <p role="status" className="text-muted py-[60px] text-center">
            프로젝트를 불러오고 있어요
          </p>
        ) : projects.isError ? (
          <p role="alert" className="text-muted py-[60px] text-center">
            프로젝트를 불러오지 못했어요.{' '}
            <button type="button" className="text-ink underline" onClick={() => projects.refetch()}>
              다시 시도
            </button>
          </p>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(300px,100%),1fr))] gap-5">
            {list.map((project, index) => (
              <li key={project.id} className="flex">
                <ProjectCard
                  project={project}
                  index={index}
                  myTurnCount={myTurnByProject.get(project.id) ?? 0}
                />
              </li>
            ))}
            {list.length === 0 ? (
              <li className="text-muted col-span-full py-[60px] text-center">
                {query ? '찾는 프로젝트가 없어요' : '아직 참여한 프로젝트가 없어요'}
              </li>
            ) : (
              <li className="flex">
                <Link
                  href="/"
                  className="group text-muted hover:border-ink hover:bg-hover hover:text-ink border-dash grid min-h-[320px] w-full place-content-center justify-items-center gap-3 rounded-2xl border-[1.5px] border-dashed text-[15px] font-bold transition-colors duration-200"
                >
                  <span className="bg-ink ease-spring grid size-11 place-items-center rounded-xl text-white transition-transform duration-300 group-hover:rotate-90">
                    <Icon name="plus" size={20} />
                  </span>
                  새 프로젝트 만들기
                </Link>
              </li>
            )}
          </ul>
        )}
      </div>
    </main>
  );
};

export default ProjectListView;
