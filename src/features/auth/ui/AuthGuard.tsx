'use client';

import { type ReactNode, useEffect } from 'react';

import { usePathname, useRouter } from 'next/navigation';

import { isPublicPath, toLoginPath } from '@/shared/lib';

import { useHasAccessToken } from '../model/session';

/**
 * 로그인/회원가입을 뺀 모든 페이지를 보호합니다.
 * 토큰이 localStorage에 있어서 서버(proxy)에서는 확인할 수 없으므로 브라우저에서 확인합니다.
 * 확인 전(서버 렌더링, hydration)과 토큰이 없을 때는 아무것도 그리지 않아 보호 화면이 깜빡이지 않습니다.
 */
const AuthGuard = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const hasToken = useHasAccessToken();
  const isPublic = isPublicPath(pathname);

  useEffect(() => {
    if (isPublic || hasToken !== false) return;
    router.replace(toLoginPath(`${pathname}${window.location.search}`));
  }, [isPublic, hasToken, pathname, router]);

  if (!isPublic && !hasToken) return null;
  return children;
};

export default AuthGuard;
