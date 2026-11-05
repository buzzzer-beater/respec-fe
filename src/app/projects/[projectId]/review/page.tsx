import { Suspense } from 'react';

import { ReviewView } from '@/views/review';

const ReviewPage = ({ params }: PageProps<'/projects/[projectId]/review'>) => (
  <Suspense fallback={<div className="flex-1" />}>
    {params.then(({ projectId }) => (
      <ReviewView projectId={Number(projectId)} />
    ))}
  </Suspense>
);

export default ReviewPage;
