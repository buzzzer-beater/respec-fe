import { Suspense } from 'react';

import { ProjectTopBar } from '@/widgets/top-bar';

const ProjectLayout = ({ children, params }: LayoutProps<'/projects/[projectId]'>) => {
  return (
    <div className="flex h-dvh flex-col">
      {/* projectId는 요청 시점에 정해지므로 Suspense 안에서 기다립니다. */}
      <Suspense fallback={<div className="border-divider h-[84px] shrink-0 border-b" />}>
        {params.then(({ projectId }) => (
          <ProjectTopBar projectId={Number(projectId)} />
        ))}
      </Suspense>
      <div className="flex min-h-0 flex-1">{children}</div>
    </div>
  );
};

export default ProjectLayout;
