import { Suspense } from 'react';

import { Sidebar } from '@/widgets/sidebar';

const ProjectSidebar = ({ projectId }: { projectId: string }) => {
  const base = `/projects/${projectId}`;

  return (
    <Sidebar
      items={[
        { href: `${base}/viewer`, label: '사이트 뷰어' },
        { href: `${base}/draft`, label: '초안 생성' },
        { href: `${base}/settings`, label: '프로젝트 설정' },
      ]}
      project={{ name: 'Project Name', plan: 'plan' }}
    />
  );
};

const ProjectLayout = ({ children, params }: LayoutProps<'/projects/[projectId]'>) => {
  return (
    <div className="flex h-screen">
      {/* projectId는 요청 시점에 정해지므로 Suspense 안에서 기다립니다. */}
      <Suspense fallback={<div className="w-80 shrink-0" />}>
        {params.then(({ projectId }) => (
          <ProjectSidebar projectId={projectId} />
        ))}
      </Suspense>
      <div aria-hidden className="bg-line-subtle w-px shrink-0" />
      {children}
    </div>
  );
};

export default ProjectLayout;
