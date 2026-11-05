import { Suspense } from 'react';

import { DraftView } from '@/views/draft';

const DraftPage = ({ params }: PageProps<'/projects/[projectId]/draft'>) => (
  // projectId는 요청 시점에 정해지므로 Suspense 안에서 기다립니다.
  <Suspense fallback={<div className="flex-1" />}>
    {params.then(({ projectId }) => (
      <DraftView projectId={Number(projectId)} />
    ))}
  </Suspense>
);

export default DraftPage;
