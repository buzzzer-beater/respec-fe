'use client';

import { type ReactNode, useEffect, useSyncExternalStore } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useGetInvitationPreview } from '@/entities/project';
import { PROJECT_ROLE_LABEL } from '@/entities/user';
import { usePostInvitationAccept } from '@/features/accept-invitation';
import { type ApiError, getAccessToken } from '@/shared/api';
import { toLoginPath } from '@/shared/lib';
import { TopBar } from '@/widgets/top-bar';

const subscribeNothing = () => () => {};

/** 서버 렌더링과 하이드레이션 중에는 `null`, 그 뒤에는 저장된 토큰이 있는지 알려 줍니다. */
const useHasAccessToken = () =>
  useSyncExternalStore<boolean | null>(
    subscribeNothing,
    () => getAccessToken() !== null,
    () => null,
  );

type InvalidReason = 'missing' | 'invalid' | 'expired';

const INVALID_COPY: Record<InvalidReason, { title: string; description: string }> = {
  missing: {
    title: '초대 링크가 올바르지 않아요',
    description: '받은 링크 전체를 그대로 열었는지 확인해 주세요.',
  },
  invalid: {
    title: '찾을 수 없는 초대 링크예요',
    description: '링크가 잘못되었을 수 있어요. 초대한 분께 새 링크를 요청해 주세요.',
  },
  expired: {
    title: '더 이상 쓸 수 없는 초대 링크예요',
    description: '링크가 만료되었거나 비활성화되었어요. 초대한 분께 새 링크를 요청해 주세요.',
  },
};

// 미리보기는 없는 토큰에 NOT_FOUND, 수락은 INVITATION_INVALID를 줍니다.
const toInvalidReason = (error: ApiError | null): InvalidReason | null => {
  if (!error) return null;
  if (error.code === 'INVITATION_EXPIRED') return 'expired';
  if (error.code === 'INVITATION_INVALID' || error.code === 'NOT_FOUND') return 'invalid';
  return null;
};

const toLoginHref = (token: string) => toLoginPath(`/invite?${new URLSearchParams({ token })}`);

const Notice = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) => (
  <div className="flex w-full max-w-sm flex-col gap-3 text-center">
    <h1 className="text-2xl font-extrabold tracking-[-0.02em]">{title}</h1>
    {description && <p className="text-muted text-sm leading-relaxed">{description}</p>}
    {children}
  </div>
);

const primaryClassName =
  'bg-ink flex h-12 items-center justify-center rounded-xl font-semibold text-white transition-transform hover:bg-[#34322e] active:scale-[0.98] disabled:opacity-60';

const InviteContent = ({ token }: { token: string }) => {
  const router = useRouter();
  const hasToken = useHasAccessToken();
  const preview = useGetInvitationPreview(token, hasToken === true);
  const accept = usePostInvitationAccept();

  // 로그인하지 않았으면 로그인 후 이 페이지로 돌아오게 보냅니다.
  // 토큰이 만료된 경우(401)는 공통 인터셉터가 처리합니다.
  useEffect(() => {
    if (hasToken === false) router.replace(toLoginHref(token));
  }, [hasToken, router, token]);

  const invalidReason = toInvalidReason(preview.error) ?? toInvalidReason(accept.error);
  if (invalidReason) return <Notice {...INVALID_COPY[invalidReason]} />;

  if (preview.error) {
    return <Notice title="초대 정보를 불러오지 못했어요" description={preview.error.message} />;
  }

  if (!preview.data) {
    return (
      <p role="status" className="text-muted text-sm">
        초대 정보를 확인하고 있어요…
      </p>
    );
  }

  const { project, invited_by, me, expires_at, already_member } = preview.data;
  const workspaceHref = `/projects/${project.id}/viewer`;

  const handleAccept = () => {
    accept.mutate(
      { token },
      { onSuccess: ({ project_id }) => router.replace(`/projects/${project_id}/viewer`) },
    );
  };

  return (
    <div className="flex w-full max-w-sm flex-col gap-7">
      <div className="flex flex-col gap-2">
        <p className="text-brand text-sm font-bold">프로젝트 초대</p>
        <h1 className="text-[28px] font-extrabold tracking-[-0.02em] break-all">{project.name}</h1>
      </div>
      <dl className="border-divider flex flex-col gap-3 rounded-2xl border p-5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted shrink-0">초대한 사람</dt>
          <dd className="text-ink truncate font-semibold">{invited_by.email}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted shrink-0">참여할 계정</dt>
          <dd className="text-ink truncate font-semibold">{me.email}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted shrink-0">참여 역할</dt>
          <dd className="text-ink font-semibold">{PROJECT_ROLE_LABEL[me.role]}</dd>
        </div>
        {!already_member && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted shrink-0">링크 만료</dt>
            <dd className="text-ink font-semibold">
              {new Date(expires_at).toLocaleString('ko-KR', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </dd>
          </div>
        )}
      </dl>

      {accept.error && (
        <p role="alert" className="text-warn text-sm font-semibold">
          {accept.error.message}
        </p>
      )}

      {already_member ? (
        <div className="flex flex-col gap-3">
          <p className="text-text text-sm">이미 참여 중인 프로젝트예요.</p>
          <Link href={workspaceHref} className={primaryClassName}>
            작업 화면으로 이동
          </Link>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleAccept}
          disabled={accept.isPending || accept.isSuccess}
          className={primaryClassName}
        >
          {accept.isPending || accept.isSuccess ? '참여하는 중…' : '초대 수락하기'}
        </button>
      )}
    </div>
  );
};

interface InviteViewProps {
  /** `/invite?token=` 쿼리. 없으면 안내 화면을 보여 줍니다. */
  token?: string;
}

const InviteView = ({ token }: InviteViewProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <main className="flex flex-1 items-center justify-center p-8 pb-24">
        {token ? <InviteContent token={token} /> : <Notice {...INVALID_COPY.missing} />}
      </main>
    </div>
  );
};

export default InviteView;
