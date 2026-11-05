export const LOGIN_PATH = '/login';
export const SIGNUP_PATH = '/signup';
/** 로그인 후 `next`가 없거나 안전하지 않을 때 가는 곳 (프로젝트 목록) */
export const DEFAULT_AFTER_AUTH_PATH = '/projects';

const PUBLIC_PATHS: readonly string[] = [LOGIN_PATH, SIGNUP_PATH];

/** 로그인 없이 볼 수 있는 페이지인지 */
export const isPublicPath = (pathname: string) => PUBLIC_PATHS.includes(pathname);

/** 로그인 후 `next` 경로로 돌아오도록 로그인 페이지 주소를 만듭니다. */
export const toLoginPath = (next: string) => `${LOGIN_PATH}?next=${encodeURIComponent(next)}`;

/** 같은 출처인지 확인하려고 쓰는 가짜 출처 */
const BASE_ORIGIN = 'http://respec.invalid';

/**
 * 오픈 리다이렉트를 막기 위해 같은 사이트 경로만 허용합니다.
 * `//evil.com`, `/\evil.com`, 탭·줄바꿈이 섞인 경로처럼 다른 사이트로 해석될 수 있으면 기본 경로를 씁니다.
 */
export const getSafeNextPath = (next: string | null | undefined): string => {
  if (!next || !next.startsWith('/') || /^\/[/\\]/.test(next)) return DEFAULT_AFTER_AUTH_PATH;
  if (/[\u0000-\u001F\u007F]/.test(next)) return DEFAULT_AFTER_AUTH_PATH;
  try {
    const url = new URL(next, BASE_ORIGIN);
    if (url.origin !== BASE_ORIGIN || isPublicPath(url.pathname)) return DEFAULT_AFTER_AUTH_PATH;
  } catch {
    return DEFAULT_AFTER_AUTH_PATH;
  }
  return next;
};
