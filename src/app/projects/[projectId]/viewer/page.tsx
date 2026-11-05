import { Suspense } from 'react';

import { SiteViewerView } from '@/views/site-viewer';

const ViewerPage = ({ params }: PageProps<'/projects/[projectId]/viewer'>) => {
  return (
    // projectId는 요청 시점에 정해지므로 Suspense 안에서 기다립니다.
    <Suspense fallback={<div className="flex-1" />}>
      {params.then(({ projectId }) => (
        <SiteViewerView projectId={Number(projectId)} />
      ))}
    </Suspense>
  );
};

export default ViewerPage;
