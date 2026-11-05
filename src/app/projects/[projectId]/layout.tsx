import { Suspense } from 'react';

import { ProjectSidebar } from '@/widgets/sidebar';

const ProjectLayout = ({ children, params }: LayoutProps<'/projects/[projectId]'>) => {
  return (
    <div className="flex h-screen">
      {/* projectId는 요청 시점에 정해지므로 Suspense 안에서 기다립니다. */}
      <Suspense fallback={<div className="w-80 shrink-0" />}>
        {params.then(({ projectId }) => (
          <ProjectSidebar projectId={Number(projectId)} />
        ))}
      </Suspense>
      <div aria-hidden className="bg-line-subtle w-px shrink-0" />
      {children}
    </div>
  );
};

export default ProjectLayout;
