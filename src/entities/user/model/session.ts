import { useSyncExternalStore } from 'react';

import { getAccessToken, setAccessToken, subscribeAccessToken } from '@/shared/api';

const EMAIL_KEY = 'respec.email';

/** 로그인한 사용자. 백엔드에 `GET /auth/me`가 없어서 JWT `sub`와 로그인 때 입력한 이메일로 만듭니다. */
export interface SessionUser {
  id: number;
  email: string | null;
}

const readUserId = (token: string): number | null => {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { sub } = JSON.parse(atob(payload)) as { sub?: unknown };
    const id = Number(sub);
    return Number.isInteger(id) ? id : null;
  } catch {
    return null;
  }
};

const readEmail = () => {
  try {
    return window.localStorage.getItem(EMAIL_KEY);
  } catch {
    return null;
  }
};

export const saveSession = (accessToken: string, email: string) => {
  try {
    window.localStorage.setItem(EMAIL_KEY, email);
  } catch {
    // 이메일은 표시용이라 저장하지 못해도 로그인은 유지합니다.
  }
  setAccessToken(accessToken);
};

export const clearSession = () => {
  try {
    window.localStorage.removeItem(EMAIL_KEY);
  } catch {
    // 위와 같습니다.
  }
  setAccessToken(null);
};

// useSyncExternalStore는 같은 값이면 같은 참조를 받아야 하므로 토큰별로 기억합니다.
let cached: { token: string | null; user: SessionUser | null } = { token: null, user: null };

const getSnapshot = (): SessionUser | null => {
  const token = getAccessToken();
  if (token !== cached.token) {
    const id = token ? readUserId(token) : null;
    cached = { token, user: id === null ? null : { id, email: readEmail() } };
  }
  return cached.user;
};

/** 서버 렌더링과 첫 hydration에서는 `null`입니다. */
export const useSessionUser = () =>
  useSyncExternalStore(subscribeAccessToken, getSnapshot, () => null);
