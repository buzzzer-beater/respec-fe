'use client';

import Link from 'next/link';

import { type Project, useGetProjectMembers } from '@/entities/project';
import { isMyTurn, useGetChangeRequests } from '@/entities/request';
import { can, PROJECT_ROLE_LABEL } from '@/entities/user';
import { InviteDeveloperButton } from '@/features/invite-developer';
import { Avatar } from '@/shared/ui';

// 카드에는 주소 전체 대신 호스트만 보여 줍니다.
const toHost = (url: string) => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};

interface ProjectCardProps {
  project: Project;
}

/**
 * 프로젝트 카드. 카드 전체가 작업 화면 링크이고, 안의 "개발자 초대" 버튼만 따로 눌립니다.
 * 참여자와 "내 차례 N"은 백엔드 `my_turn_count`가 생기기 전까지 카드마다 한 번씩 받아 셉니다.
 */
const ProjectCard = ({ project }: ProjectCardProps) => {
  const { id, name, my_role, deployment_url, unresolved_request_count } = project;
  const members = useGetProjectMembers(id);
  // 목록 화면에서는 프로젝트마다 주기적으로 다시 받지 않습니다.
  const { data: requests } = useGetChangeRequests(id, undefined, { polling: false });
  const myTurnCount = requests?.filter((request) => isMyTurn(request.status, my_role)).length ?? 0;
  const hasDeveloper = members.data?.some((member) => member.role === 'developer');

  return (
    <article className="border-divider hover:border-ink relative flex h-full flex-col gap-4 rounded-2xl border bg-white p-6 transition-colors has-[a:focus-visible]:outline-2">
      <div className="flex items-start justify-between gap-3">
        <h2 className="line-clamp-2 text-lg font-extrabold tracking-[-0.01em]">
          {/* 카드 전체를 누를 수 있게 링크를 카드 크기로 넓힙니다. */}
          <Link
            href={`/projects/${id}/viewer`}
            className="outline-none after:absolute after:inset-0 after:rounded-2xl"
          >
            {name}
          </Link>
        </h2>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
            my_role === 'client' ? 'bg-brand-soft text-brand' : 'bg-hover text-text'
          }`}
        >
          {PROJECT_ROLE_LABEL[my_role]}
        </span>
      </div>
      <p className="text-muted truncate text-sm">
        {deployment_url ? <span title={deployment_url}>{toHost(deployment_url)}</span> : '배포 전'}
      </p>

      <div className="mt-auto flex min-h-9 items-center gap-3 text-sm">
        {members.isSuccess && !hasDeveloper ? (
          <>
            <span className="text-text">아직 개발자가 없어요</span>
            {can(my_role, 'invite-developer') && (
              <InviteDeveloperButton
                projectId={id}
                label="개발자 초대"
                className="relative z-10 ml-auto h-8 px-3 text-xs"
              />
            )}
          </>
        ) : (
          <>
            <span className="text-text">
              남은 요청 <strong className="text-ink">{unresolved_request_count}</strong>
            </span>
            {myTurnCount > 0 && (
              <span className="text-alert flex items-center gap-1 font-bold">
                <span aria-hidden className="bg-alert size-1.5 rounded-full" />내 차례 {myTurnCount}
              </span>
            )}
            {members.data && (
              <ul aria-label="참여자" className="ml-auto flex">
                {members.data.map((member) => (
                  <li
                    key={member.id}
                    title={`${member.email} (${PROJECT_ROLE_LABEL[member.role]})`}
                    className="-ml-1.5 first:ml-0"
                  >
                    <Avatar
                      alt={member.email}
                      size={26}
                      className={`border-2 border-white text-[10px] ${member.role === 'client' ? 'bg-brand' : 'bg-ink'}`}
                    />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </article>
  );
};

export default ProjectCard;
