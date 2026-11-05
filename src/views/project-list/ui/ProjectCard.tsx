import Link from 'next/link';

import { type Project, useGetProjectMembers } from '@/entities/project';
import { isMyTurn, useGetChangeRequests } from '@/entities/request';
import { PROJECT_ROLE_LABEL } from '@/entities/user';
import { InviteDeveloperButton } from '@/features/invite-developer';

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

const ProjectCard = ({ project }: ProjectCardProps) => {
  const { id, name, my_role, deployment_url, unresolved_request_count } = project;
  const members = useGetProjectMembers(id);
  const hasDeveloper = members.data?.some((member) => member.role === 'developer') ?? true;
  // "내 차례 N"은 백엔드 `my_turn_count`가 생기기 전까지 카드마다 한 번씩 받아 셉니다.
  // 목록 화면에서는 프로젝트마다 주기적으로 다시 받지 않습니다.
  const { data: requests } = useGetChangeRequests(id, undefined, { polling: false });
  const myTurnCount = requests?.filter((request) => isMyTurn(request.status, my_role)).length ?? 0;

  return (
    <article className="border-divider flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:-translate-y-[3px] hover:shadow-lg">
      <Link href={`/projects/${id}/viewer`} className="group flex flex-1 flex-col">
        <div className="bg-stage relative grid h-[168px] place-items-center overflow-hidden px-7 pt-[22px]">
          <span className="absolute top-3 left-3 rounded-full bg-white px-2.5 py-1 text-xs font-bold shadow-sm">
            {deployment_url ? '배포됨' : '초안'}
          </span>
          <div className="flex h-full w-full max-w-[220px] flex-col gap-2 rounded-xl bg-white p-3 shadow-[0_4px_16px_rgba(24,24,27,0.08)] transition-transform group-hover:-translate-y-1">
            <span className="bg-hover h-2 w-2/5 rounded-full" />
            <span className="bg-brand-soft h-10 w-full rounded-md" />
            <span className="grid flex-1 grid-cols-3 gap-2">
              <i className="bg-stage rounded" />
              <i className="bg-stage rounded" />
              <i className="bg-stage rounded" />
            </span>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-3.5 p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="line-clamp-2 text-lg font-extrabold tracking-[-0.01em]">{name}</h2>
            <span
              className={`bg-hover text-text shrink-0 rounded-full px-2.5 py-1 text-xs font-bold`}
            >
              {PROJECT_ROLE_LABEL[my_role]}
            </span>
          </div>
          <p className="text-muted truncate text-sm">
            {deployment_url ? (
              <span title={deployment_url}>{toHost(deployment_url)}</span>
            ) : (
              '배포 전 · 초안만 있어요'
            )}
          </p>
          <div className="border-divider mt-auto flex items-center gap-3 border-t pt-3.5 text-sm">
            {hasDeveloper ? (
              <>
                <span className="text-muted">
                  남은 요청 <strong className="text-ink">{unresolved_request_count}</strong>
                </span>
                {myTurnCount > 0 && (
                  <span className="text-alert flex items-center gap-1 font-bold">
                    <span aria-hidden className="bg-alert size-1.5 rounded-full" />내 차례{' '}
                    {myTurnCount}
                  </span>
                )}
                <span className="ml-auto flex -space-x-2" aria-label="프로젝트 참여자">
                  {(members.data ?? []).slice(0, 3).map((member) => (
                    <span
                      key={member.id}
                      title={member.email}
                      className={`grid size-8 place-items-center rounded-full border-2 border-white text-xs font-bold ${member.role === 'client' ? 'bg-brand-soft text-brand' : 'bg-ink text-white'}`}
                    >
                      {member.email.slice(0, 1).toUpperCase()}
                    </span>
                  ))}
                </span>
              </>
            ) : (
              <span className="text-muted">아직 개발자가 없어요</span>
            )}
          </div>
        </div>
      </Link>
      {my_role === 'client' && !hasDeveloper && (
        <div className="px-5 pb-5">
          <InviteDeveloperButton projectId={id} label="개발자 초대" />
        </div>
      )}
    </article>
  );
};

export default ProjectCard;
