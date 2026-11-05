import { Suspense } from 'react';

import { RequestBoardView } from '@/views/request-board';

const RequestsPage = ({ params }: PageProps<'/projects/[projectId]/requests'>) => (
  <Suspense fallback={<div className="flex-1" />}>
    {params.then(({ projectId }) => (
      <RequestBoardView projectId={Number(projectId)} />
    ))}
  </Suspense>
);

export default RequestsPage;
