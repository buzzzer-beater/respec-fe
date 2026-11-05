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
