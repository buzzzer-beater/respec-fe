'use client';

import { useGetProject, useGetProjectMembers } from '@/entities/project';
import { PROJECT_ROLE_LABEL } from '@/entities/user';
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
        { href: `${base}/viewer`, label: '작업 화면' },
        { href: `${base}/requests`, label: '요청 관리' },
        { href: `${base}/review`, label: '검수' },
      ]}
    >
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
    </TopBar>
  );
};

export default ProjectTopBar;
