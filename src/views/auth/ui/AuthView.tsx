import { Suspense } from 'react';

import { AuthForm } from '@/features/auth';
import { TopBar } from '@/widgets/top-bar';

interface AuthViewProps {
  mode: 'login' | 'signup';
}

const AuthView = ({ mode }: AuthViewProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <main className="flex flex-1 items-center justify-center p-8 pb-24">
        {/* `next` 쿼리(useSearchParams)는 요청 시점에 정해지므로 Suspense 안에서 읽습니다. */}
        <Suspense>
          <AuthForm mode={mode} />
        </Suspense>
      </main>
    </div>
  );
};

export default AuthView;
