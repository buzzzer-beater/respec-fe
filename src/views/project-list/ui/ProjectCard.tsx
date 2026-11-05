import Link from 'next/link';

import { type Project, useGetProjectMembers } from '@/entities/project';
import { PROJECT_ROLE_LABEL, RoleAvatar } from '@/entities/user';
import { InviteDeveloperButton } from '@/features/invite-developer';
import { Icon } from '@/shared/ui';

// 카드에는 주소 전체 대신 호스트만 보여 줍니다.
const toHost = (url: string) => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};

// 사이트 미리보기 자리의 큰 띠 색. 백엔드에 썸네일이 없어서 프로젝트마다 돌려 씁니다.
const TONES = ['#e7e7ea', '#ecebfd', '#f1efe9', '#e9eef0'];

// "고객으로 참여" / "개발자로 참여"
const ROLE_JOIN_LABEL = {
  client: `${PROJECT_ROLE_LABEL.client}으로 참여`,
  developer: `${PROJECT_ROLE_LABEL.developer}로 참여`,
} as const;

interface ProjectCardProps {
  project: Project;
  /** 등장 순서. 카드마다 50ms씩 늦게 나타납니다. */
  index: number;
}

/** demo-design `.project` 카드. 카드 전체가 링크이고, 개발자가 없으면 카드 안에서 바로 초대합니다. */
const ProjectCard = ({ project, index }: ProjectCardProps) => {
  const {
    id,
    name,
    my_role,
    deployment_url,
    has_draft,
    unresolved_request_count,
    my_turn_count: myTurnCount,
  } = project;
  const members = useGetProjectMembers(id);
  const hasDeveloper = members.data?.some((member) => member.role === 'developer') ?? true;
  // 배포 전 프로젝트는 고객이 초안 화면에서 이어 갑니다.
  const href =
    !deployment_url && my_role === 'client' ? `/projects/${id}/draft` : `/projects/${id}/viewer`;

  return (
    <article
      style={{ animationDelay: `${index * 50}ms` }}
      className="group ease-spring relative flex w-full animate-[pop-in_0.35s_var(--ease-out-soft)_backwards] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_0_0_1px_var(--color-divider),0_1px_2px_rgba(24,24,27,0.04)] transition-[translate,box-shadow] duration-300 hover:-translate-y-[3px] hover:shadow-[0_0_0_1px_var(--color-divider),0_12px_28px_rgba(24,24,27,0.1)]"
    >
      <div className="bg-stage relative h-[168px] px-[26px] pt-[22px]" aria-hidden>
        <span className="text-text absolute top-3.5 left-3.5 rounded-full bg-white px-[9px] py-1 text-xs font-bold shadow-[0_1px_3px_rgba(24,24,27,0.08)]">
          {deployment_url ? '배포됨' : has_draft ? '초안' : '시작 전'}
        </span>
        <div className="grid h-full content-start gap-2 rounded-t-lg bg-white px-4 py-3.5 shadow-[0_0_0_1px_rgba(24,24,27,0.05)]">
          <i className="bg-bar block h-2 w-2/5 rounded" />
          <i
            className="block h-[46px] rounded-md"
            style={{ background: TONES[id % TONES.length] }}
          />
          <span className="grid grid-cols-3 gap-1.5">
            <i className="bg-bar block h-[26px] rounded-[5px]" />
            <i className="bg-bar block h-[26px] rounded-[5px]" />
            <i className="bg-bar block h-[26px] rounded-[5px]" />
          </span>
        </div>
      </div>

      <div className="grid gap-3.5 px-[22px] pt-5 pb-[22px]">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-[17px] font-extrabold">
            {/* 카드 전체를 누를 수 있게 링크를 카드 크기로 늘립니다. */}
            <Link
              href={href}
              className="focus-visible:after:outline-ink after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2"
            >
              {name}
            </Link>
          </h3>
          <span className="bg-hover text-text ml-auto shrink-0 rounded-full px-[9px] py-[3px] text-xs font-bold">
            {ROLE_JOIN_LABEL[my_role]}
          </span>
        </div>
        {deployment_url ? (
          <p className="text-muted -mt-2 flex items-center gap-1.5 overflow-hidden text-[13px] whitespace-nowrap">
            <Icon name="link" size={13} />
            <span className="truncate" title={deployment_url}>
              {toHost(deployment_url)}
            </span>
          </p>
        ) : (
          <p className="text-faint -mt-2 text-[13px]">
            {has_draft ? '배포 전 · 초안만 있어요' : '아직 초안이 없어요'}
          </p>
        )}
        <div className="border-divider flex min-h-[47px] items-center gap-2.5 border-t pt-3.5 text-[13px]">
          {hasDeveloper ? (
            <>
              <span className="text-muted">
                남은 요청 <b className="text-ink text-[15px]">{unresolved_request_count}</b>
              </span>
              {myTurnCount > 0 && (
                <span className="text-ink ml-0.5 inline-flex items-center gap-[5px] text-xs font-bold whitespace-nowrap">
                  <span aria-hidden className="bg-alert size-1.5 rounded-full" />내 차례{' '}
                  {myTurnCount}
                </span>
              )}
              <span className="ml-auto flex" aria-label="프로젝트 참여자">
                {(members.data ?? []).map((member) => (
                  <RoleAvatar
                    key={member.id}
                    name={member.email}
                    role={member.role}
                    size={24}
                    className="border-2 border-white not-first:-ml-[7px]"
                  />
                ))}
              </span>
            </>
          ) : (
            <>
              <span className="text-muted">아직 개발자가 없어요</span>
              {my_role === 'client' && (
                <InviteDeveloperButton
                  projectId={id}
                  projectName={name}
                  label="개발자 초대"
                  className="relative z-10 ml-auto"
                />
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
};

export default ProjectCard;
