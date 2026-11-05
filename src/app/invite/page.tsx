import { Suspense } from 'react';

import { InviteView } from '@/views/invite';

const InvitePage = ({ searchParams }: PageProps<'/invite'>) => (
  // token은 요청 시점에 정해지므로 Suspense 안에서 기다립니다.
  <Suspense fallback={<div className="min-h-screen" />}>
    {searchParams.then(({ token }) => (
      <InviteView token={typeof token === 'string' && token ? token : undefined} />
    ))}
  </Suspense>
);

export default InvitePage;
