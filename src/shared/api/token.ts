const TOKEN_KEY = 'respec.access-token';

export const getAccessToken = (): string | null => {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setAccessToken = (token: string | null) => {
  try {
    if (token === null) window.localStorage.removeItem(TOKEN_KEY);
    else window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // 저장소를 쓸 수 없으면 이번 페이지에서만 로그인이 풀립니다.
  }
};

/** 다른 탭에서 로그인·로그아웃해 토큰이 바뀌면 알려 줍니다. 같은 탭에서 바꾼 것은 알리지 않습니다. */
export const subscribeAccessToken = (onChange: () => void) => {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === TOKEN_KEY || event.key === null) onChange();
  };
  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
};
