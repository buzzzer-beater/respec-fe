const TOKEN_KEY = 'respec.access-token';

// 토큰이 바뀌면 같은 탭의 구독자에게도 알립니다. (`storage` 이벤트는 다른 탭에서만 옵니다.)
const TOKEN_CHANGE_EVENT = 'respec:token-change';

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
  window.dispatchEvent(new Event(TOKEN_CHANGE_EVENT));
};

export const subscribeAccessToken = (onChange: () => void) => {
  window.addEventListener('storage', onChange);
  window.addEventListener(TOKEN_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(TOKEN_CHANGE_EVENT, onChange);
  };
};
