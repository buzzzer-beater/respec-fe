'use client';

import { useEffect } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useGetInvitationPreview } from '@/entities/project';
import { PROJECT_ROLE_LABEL, RoleAvatar } from '@/entities/user';
import { usePostInvitationAccept } from '@/features/accept-invitation';
import { useHasAccessToken, usePostLogout } from '@/features/auth';
import type { ApiError } from '@/shared/api';
import { toLoginPath } from '@/shared/lib';
import { buttonClassName, toast } from '@/shared/ui';
import { TopBar } from '@/widgets/top-bar';

// 수락 안내를 잠깐 보여 준 뒤 프로젝트 목록으로 갑니다.
const ACCEPT_REDIRECT_DELAY_MS = 1000;

// 미리보기는 없는 토큰에 NOT_FOUND, 수락은 INVITATION_INVALID, 만료·끈 링크는 INVITATION_EXPIRED를 줍니다.
const isUnavailable = (error: ApiError | null) =>
  !!error &&
  (error.code === 'INVITATION_EXPIRED' ||
    error.code === 'INVITATION_INVALID' ||
    error.code === 'NOT_FOUND');

const toInviteNext = (token: string) => `/invite?${new URLSearchParams({ token })}`;

/** 링크가 없거나 만료됐거나 꺼졌을 때. 시안은 한 문구로 안내합니다. */
const Unavailable = () => (
  <div className="grid gap-3 text-center">
    <h2 className="text-[30px] font-extrabold tracking-[-0.02em]">링크가 더 이상 열리지 않아요</h2>
    <p className="text-muted text-[15px] leading-[1.7]">
      초대 링크가 만료됐거나 꺼졌어요.
      <br />
      초대한 분께 새 링크를 부탁해 주세요.
    </p>
    <Link
      href="/projects"
      className={buttonClassName({ variant: 'secondary', className: 'mt-3 justify-self-center' })}
    >
      내 프로젝트로 가기
    </Link>
  </div>
);

const InviteContent = ({ token }: { token: string }) => {
  const router = useRouter();
  const hasToken = useHasAccessToken();
  const preview = useGetInvitationPreview(token, hasToken === true);
  const accept = usePostInvitationAccept();
  const logout = usePostLogout();

  // 로그인하지 않았으면 로그인 후 이 페이지로 돌아오게 보냅니다.
  // 토큰이 만료된 경우(401)는 공통 인터셉터가 처리합니다.
  useEffect(() => {
    if (hasToken === false && !logout.isPending) router.replace(toLoginPath(toInviteNext(token)));
  }, [hasToken, logout.isPending, router, token]);

  if (isUnavailable(preview.error) || isUnavailable(accept.error)) return <Unavailable />;

  if (preview.error) {
    return (
      <div className="grid gap-3 text-center">
        <h2 className="text-2xl font-extrabold">초대 정보를 불러오지 못했어요</h2>
        <p className="text-muted text-sm">{preview.error.message}</p>
      </div>
    );
  }

  if (!preview.data) {
    return (
      <p role="status" className="text-muted text-center text-sm">
        초대 정보를 확인하고 있어요…
      </p>
    );
  }

  const { project, invited_by, me, already_member } = preview.data;
  const isBusy = accept.isPending || accept.isSuccess;

  const handleAccept = () => {
    accept.mutate(
      { token },
      {
        onSuccess: () => {
          toast(`${project.name}에 참여했어요`);
          setTimeout(() => router.replace('/projects'), ACCEPT_REDIRECT_DELAY_MS);
        },
      },
    );
  };

  // 다른 계정으로 참여하려면 로그아웃하고 이 초대로 돌아오는 로그인 화면으로 갑니다.
  const handleOtherAccount = () =>
    logout.mutate(undefined, {
      onSuccess: () => router.replace(toLoginPath(toInviteNext(token))),
    });

  return (
    <div className="grid gap-7">
      <div className="bg-stage h-[180px] rounded-2xl px-8 pt-6" aria-hidden>
        <div className="grid h-full content-start gap-[9px] rounded-t-[9px] bg-white px-[18px] py-4 shadow-[0_0_0_1px_rgba(24,24,27,0.05)]">
          <i className="bg-bar block h-[9px] w-2/5 rounded" />
          <i className="block h-[52px] rounded-md bg-[#f1efe9]" />
          <span className="grid grid-cols-3 gap-[7px]">
            <i className="bg-bar block h-[30px] rounded" />
            <i className="bg-bar block h-[30px] rounded" />
            <i className="bg-bar block h-[30px] rounded" />
          </span>
        </div>
      </div>

      <div>
        <p className="text-muted mb-2 text-sm font-semibold">초대를 받았어요</p>
        <h2 className="text-[30px] font-extrabold tracking-[-0.02em] break-all">{project.name}</h2>
        <p className="text-text mt-3.5 flex items-center gap-2 text-[15px]">
          <RoleAvatar name={invited_by.email} role="client" size={26} />
          {invited_by.email} 님이 개발자로 함께해 달라고 했어요
        </p>
      </div>

      <dl className="bg-ai grid rounded-[14px] px-5 py-1.5">
        <div className="border-divider flex gap-4 border-b py-3 text-sm">
          <dt className="text-muted w-[84px] shrink-0">참여 역할</dt>
          <dd className="text-ink leading-[1.6] font-semibold">{PROJECT_ROLE_LABEL[me.role]}</dd>
        </div>
        <div className="flex gap-4 py-3 text-sm">
          <dt className="text-muted w-[84px] shrink-0">하는 일</dt>
          <dd className="text-ink leading-[1.6] font-semibold">
            초안 코드를 받아 고치고, 요청에 답하고, 검수를 요청해요
          </dd>
        </div>
      </dl>

      <p className="text-muted flex items-center gap-2.5 text-[13px]">
        <RoleAvatar name={me.email} role="developer" size={28} />
        <span className="min-w-0 truncate">
          <b className="text-ink">{me.email}</b> 계정으로 참여해요
        </span>
        <button
          type="button"
          onClick={handleOtherAccount}
          disabled={logout.isPending}
          className="text-muted hover:text-ink ml-auto shrink-0 underline"
        >
          다른 계정
        </button>
      </p>

      {accept.error && (
        <p role="alert" className="text-warn text-[13px] font-semibold">
          {accept.error.message}
        </p>
      )}

      {already_member ? (
        <div className="grid gap-3">
          <p className="text-text text-sm">이미 참여 중인 프로젝트예요.</p>
          <Link
            href={`/projects/${project.id}/viewer`}
            className={buttonClassName({ className: 'h-[52px] text-[15px]' })}
          >
            작업 화면으로 가기
          </Link>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleAccept}
            disabled={isBusy}
            className={buttonClassName({ className: 'h-[52px] flex-1 text-[15px]' })}
          >
            {isBusy ? '참여하는 중…' : '수락하고 참여하기'}
          </button>
        </div>
      )}
    </div>
  );
};

interface InviteViewProps {
  /** `/invite?token=` 쿼리. 없으면 안내 화면을 보여 줍니다. */
  token?: string;
}

/** demo-design `invite.html`: 어떤 프로젝트인지, 누가 불렀는지, 어떤 계정으로 들어가는지 보여 줍니다. */
const InviteView = ({ token }: InviteViewProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      <title>RE:SPEC — 초대 수락</title>
      <TopBar title="초대" minimal />
      <main className="grid min-h-[calc(100vh-84px)] place-items-center px-6 pt-12 pb-20">
        <div className="w-[min(520px,100%)] animate-[pop-in_0.4s_var(--ease-out-soft)]">
          {token ? <InviteContent token={token} /> : <Unavailable />}
        </div>
      </main>
    </div>
  );
};

export default InviteView;
