import { Suspense } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { AuthForm } from '@/features/auth';
import logo from '@/widgets/top-bar/assets/respec-logo.png';

interface AuthViewProps {
  mode: 'login' | 'signup';
}

/**
 * demo-design `login.html`. 왼쪽은 서비스가 하는 일을 한 장면(사이트 위 핀 + 대화)으로 보여 주고,
 * 오른쪽은 이메일 + 비밀번호 폼입니다. 960px보다 좁으면 장면을 숨깁니다.
 */
const AuthView = ({ mode }: AuthViewProps) => {
  return (
    <div className="grid h-screen min-[961px]:grid-cols-[minmax(0,1.1fr)_minmax(420px,1fr)]">
      <section
        aria-hidden
        className="bg-stage hidden min-w-0 flex-col justify-between px-12 pt-10 pb-12 min-[961px]:flex"
      >
        <Link href="/projects" aria-label="RE:SPEC 처음으로" tabIndex={-1} className="self-start">
          <Image
            src={logo}
            alt=""
            unoptimized
            priority
            className="block h-[34px] w-[154px] object-cover"
          />
        </Link>

        <div className="relative my-10 w-[min(560px,100%)] animate-[pop-in_0.5s_var(--ease-out-soft)] rounded-[14px] bg-white p-6 shadow-[0_0_0_1px_rgba(24,24,27,0.05),0_12px_36px_rgba(24,24,27,0.08)]">
          <i className="bg-bar block h-2.5 w-[30%] rounded-[5px]" />
          <i className="my-3.5 block h-[120px] rounded-lg bg-[#f4f4f6]" />
          <span className="absolute top-28 left-1/2 h-[34px] w-[120px] -translate-x-1/2 rounded-lg bg-[#d9d9de]" />
          <span className="bg-brand absolute top-[104px] left-[calc(50%+50px)] grid size-[30px] -translate-y-full animate-[drop_0.5s_0.4s_var(--ease-out-soft)_both] place-items-center rounded-[50%_50%_50%_6px] text-[13px] font-extrabold text-white">
            1
          </span>
          <div className="absolute top-16 left-[calc(50%+92px)] grid w-[230px] gap-2">
            <p className="animate-[pop-in_0.4s_0.8s_var(--ease-out-soft)_backwards] rounded-[4px_14px_14px_14px] bg-white px-3.5 py-2.5 text-[13px] leading-normal shadow-[0_6px_18px_rgba(24,24,27,0.1)]">
              <small className="text-muted mb-0.5 block text-[11px]">김하늘 · 고객</small>이 버튼이
              폰에서 너무 작아요
            </p>
            <p className="bg-brand-soft animate-[pop-in_0.4s_1.3s_var(--ease-out-soft)_backwards] justify-self-end rounded-[14px_4px_14px_14px] px-3.5 py-2.5 text-[13px] leading-normal shadow-[0_6px_18px_rgba(24,24,27,0.1)]">
              <small className="text-muted mb-0.5 block text-[11px]">박도윤 · 개발자</small>
              크게 바꿔서 올렸어요. 확인해 주세요!
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <i className="bg-bar block h-14 rounded-lg" />
            <i className="bg-bar block h-14 rounded-lg" />
            <i className="bg-bar block h-14 rounded-lg" />
          </div>
        </div>

        <div>
          <h2 className="text-[34px] leading-[1.35] font-extrabold tracking-[-0.02em]">
            사이트 위를 바로 짚어서
            <br />
            고쳐 달라고 말하세요
          </h2>
          <p className="text-muted mt-3 text-base leading-[1.6]">
            고객과 개발자가 같은 화면을 보며 수정 요청을 주고받아요.
          </p>
        </div>
      </section>

      <main className="grid place-items-center overflow-y-auto p-10">
        {/* `next` 쿼리(useSearchParams)는 요청 시점에 정해지므로 Suspense 안에서 읽습니다. */}
        <Suspense>
          <AuthForm mode={mode} />
        </Suspense>
      </main>
    </div>
  );
};

export default AuthView;
