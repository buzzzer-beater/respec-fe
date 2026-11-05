'use client';

import { useRouter } from 'next/navigation';

import { LOGIN_PATH } from '@/shared/lib';

import { usePostLogout } from '../api/auth';
import { useHasAccessToken } from '../model/session';

/** 로그인한 상태에서만 보이는 작은 로그아웃 버튼 */
const LogoutButton = () => {
  const router = useRouter();
  const hasToken = useHasAccessToken();
  const logout = usePostLogout();

  if (!hasToken && !logout.isPending) return null;

  return (
    <button
      type="button"
      disabled={logout.isPending}
      onClick={() => logout.mutate(undefined, { onSuccess: () => router.replace(LOGIN_PATH) })}
      className="text-muted hover:text-ink shrink-0 text-sm font-semibold whitespace-nowrap transition-colors disabled:opacity-60"
    >
      로그아웃
    </button>
  );
};

export default LogoutButton;
