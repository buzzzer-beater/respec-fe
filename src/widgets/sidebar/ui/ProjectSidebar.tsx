'use client';

import { useGetProject } from '@/entities/project';
import { PROJECT_ROLE_LABEL } from '@/entities/user';

import Sidebar from './Sidebar';

interface ProjectSidebarProps {
  projectId: number;
}

const ProjectSidebar = ({ projectId }: ProjectSidebarProps) => {
  const { data: project } = useGetProject(projectId);
  const base = `/projects/${projectId}`;

  return (
    <Sidebar
      items={[
        { href: `${base}/viewer`, label: '사이트 뷰어' },
        { href: `${base}/draft`, label: '초안 생성' },
        { href: `${base}/settings`, label: '프로젝트 설정' },
      ]}
      project={{
        name: project?.name ?? '',
        plan: project && PROJECT_ROLE_LABEL[project.my_role],
      }}
    />
  );
};

export default ProjectSidebar;
