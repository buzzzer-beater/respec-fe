'use client';

import { useGetProject, useGetProjectMembers } from '@/entities/project';
import { can, PROJECT_ROLE_LABEL } from '@/entities/user';
import { ConnectDeploymentButton } from '@/features/connect-deployment';
import { DownloadDraftButton } from '@/features/download-draft';
import { InviteDeveloperButton } from '@/features/invite-developer';
import { Avatar } from '@/shared/ui';

import TopBar from './TopBar';

interface ProjectTopBarProps {
  projectId: number;
}

const ProjectTopBar = ({ projectId }: ProjectTopBarProps) => {
  const { data: project } = useGetProject(projectId);
  const { data: members = [] } = useGetProjectMembers(projectId);
  const base = `/projects/${projectId}`;

  return (
    <TopBar
      title={project?.name}
      links={[
        { href: `${base}/draft`, label: '초안' },
        { href: `${base}/viewer`, label: '작업 화면' },
        { href: `${base}/requests`, label: '요청 관리' },
        { href: `${base}/review`, label: '검수' },
      ]}
    >
      {/* 배포 전에는 초안을 보여 주므로 초안 코드를 받을 수 있게 합니다. */}
      {project && !project.deployment_url && <DownloadDraftButton projectId={projectId} />}
      <ConnectDeploymentButton projectId={projectId} />
      {members.length > 0 && (
        <ul aria-label="참여자" className="flex">
          {members.map((member) => (
            <li
              key={member.id}
              title={`${member.email} (${PROJECT_ROLE_LABEL[member.role]})`}
              className="-ml-1.5 first:ml-0"
            >
              <Avatar
                alt={member.email}
                size={30}
                className={`border-2 border-white text-xs ${member.role === 'client' ? 'bg-brand' : 'bg-ink'}`}
              />
            </li>
          ))}
        </ul>
      )}
      {can(project?.my_role, 'invite-developer') && <InviteDeveloperButton projectId={projectId} />}
    </TopBar>
  );
};

export default ProjectTopBar;
