'use client';

import { usePathname } from 'next/navigation';

import { useGetProject, useGetProjectDraft, useGetProjectMembers } from '@/entities/project';
import { isMyTurn, useGetChangeRequests } from '@/entities/request';
import { can, PROJECT_ROLE_LABEL, RoleAvatar } from '@/entities/user';
import { DeploymentChip } from '@/features/connect-deployment';
import { DownloadDraftButton } from '@/features/download-draft';
import { InviteDeveloperButton } from '@/features/invite-developer';
import { SiteSelect } from '@/features/switch-site';

import TopBar from './TopBar';

interface ProjectTopBarProps {
  projectId: number;
}

/**
 * 프로젝트 화면의 상단 바. 화면 전환은 작업 화면과 요청 관리 둘이고, 요청 관리에는 내 차례 수가 붙습니다.
 * 배포 주소·코드 받기·참여자·초대는 작업 화면에서만 보입니다. 초안 화면은 제목과 내 아바타만 둡니다.
 */
const ProjectTopBar = ({ projectId }: ProjectTopBarProps) => {
  const { data: project } = useGetProject(projectId);
  const { data: members = [] } = useGetProjectMembers(projectId);
  const { data: draft } = useGetProjectDraft(projectId);
  const { data: requests = [] } = useGetChangeRequests(projectId);
  const base = `/projects/${projectId}`;
  const pathname = usePathname();
  const isViewer = pathname === `${base}/viewer`;
  const isDraft = pathname === `${base}/draft`;
  const myRole = project?.my_role ?? null;
  const myTurnCount = requests.filter((request) => isMyTurn(request.status, myRole)).length;

  return (
    <TopBar
      title={project?.name}
      myRole={myRole}
      titleAddon={
        isViewer && project ? (
          <SiteSelect hasDraft={!!draft} hasDeployment={!!project.deployment_url} />
        ) : undefined
      }
      links={
        isDraft
          ? []
          : [
              { href: `${base}/viewer`, label: '작업 화면' },
              { href: `${base}/requests`, label: '요청 관리', badge: myTurnCount },
            ]
      }
    >
      {isViewer && (
        <>
          <DeploymentChip projectId={projectId} />
          {/* 배포 전에는 개발자가 초안 코드로 시작하므로 코드를 받을 수 있게 합니다. */}
          {project && !project.deployment_url && <DownloadDraftButton projectId={projectId} />}
          {members.length > 0 && (
            <span aria-label="참여자" className="hidden sm:inline-flex">
              {members.map((member) => (
                <RoleAvatar
                  key={member.id}
                  name={member.email}
                  role={member.role}
                  size={26}
                  className="shadow-[0_0_0_2px_#fff] not-first:-ml-1.5"
                />
              ))}
              <span className="sr-only">
                {members
                  .map((member) => `${member.email} (${PROJECT_ROLE_LABEL[member.role]})`)
                  .join(', ')}
              </span>
            </span>
          )}
          {can(myRole, 'invite-developer') && <InviteDeveloperButton projectId={projectId} />}
        </>
      )}
    </TopBar>
  );
};

export default ProjectTopBar;
