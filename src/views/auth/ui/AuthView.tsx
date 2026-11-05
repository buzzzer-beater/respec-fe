import { Suspense } from 'react';

import Image from 'next/image';

import { AuthForm } from '@/features/auth';
import { TopBar } from '@/widgets/top-bar';
import logo from '@/widgets/top-bar/assets/respec-logo.png';

interface AuthViewProps {
  mode: 'login' | 'signup';
}

const AuthView = ({ mode }: AuthViewProps) => {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,1fr)]">
      <aside className="bg-stage hidden min-h-screen flex-col justify-between overflow-hidden p-12 lg:flex">
        <div className="relative h-12 w-[140px] overflow-hidden">
          <Image src={logo} alt="RE:SPEC" unoptimized className="h-auto w-full -translate-y-2" />
        </div>
        <div>
          <h2 className="text-[34px] leading-[1.35] font-extrabold tracking-[-0.02em]">
            말로 만든 사이트를,
            <br />
            함께 완성해요.
          </h2>
          <p className="text-muted mt-3 text-base leading-relaxed">
            바꾸고 싶은 곳에 핀을 남기고, 같은 화면을 보며 이야기하세요.
          </p>
          <div className="relative mt-10 max-w-[560px] rounded-[14px] bg-white p-6 shadow-[0_12px_36px_rgba(24,24,27,0.08)]">
            <div className="bg-hover h-2.5 w-2/5 rounded-full" />
            <div className="bg-stage relative mt-4 h-[120px] rounded-lg">
              <span className="bg-brand absolute top-10 left-1/2 grid size-8 -translate-y-full place-items-center rounded-[50%_50%_50%_6px] text-sm font-extrabold text-white">
                1
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2.5">
              <i className="bg-hover h-14 rounded-lg" />
              <i className="bg-hover h-14 rounded-lg" />
              <i className="bg-hover h-14 rounded-lg" />
            </div>
            <div className="absolute top-12 right-[-14px] rounded-[4px_14px_14px_14px] bg-white px-3.5 py-2.5 text-[13px] shadow-lg">
              구매 버튼을 더 크게 해 주세요
            </div>
          </div>
        </div>
        <p className="text-muted text-xs">RE:SPEC · 고객과 개발자가 함께 만드는 공간</p>
      </aside>
      <main className="flex min-h-screen flex-col">
        <div className="lg:hidden">
          <TopBar />
        </div>
        <div className="flex flex-1 items-center justify-center p-8">
          {/* `next` 쿼리(useSearchParams)는 요청 시점에 정해지므로 Suspense 안에서 읽습니다. */}
          <Suspense>
            <AuthForm mode={mode} />
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default AuthView;
