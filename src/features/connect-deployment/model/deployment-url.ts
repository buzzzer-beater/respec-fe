export type DeploymentUrlError = 'empty' | 'invalid' | 'not-https' | 'has-credentials';

export type DeploymentUrlResult =
  { ok: true; url: string } | { ok: false; error: DeploymentUrlError };

export const DEPLOYMENT_URL_ERROR_MESSAGE: Record<DeploymentUrlError, string> = {
  empty: '배포 사이트 주소를 입력해 주세요.',
  invalid: '올바른 주소가 아니에요. https://로 시작하는 전체 주소를 넣어 주세요.',
  'not-https': 'https://로 시작하는 주소만 연결할 수 있어요.',
  'has-credentials': '아이디나 비밀번호가 들어간 주소는 연결할 수 없어요.',
};

/** 백엔드 검증과 같은 규칙입니다: https만, 계정 정보 없는 URL */
export const validateDeploymentUrl = (value: string): DeploymentUrlResult => {
  const trimmed = value.trim();
  if (!trimmed) return { ok: false, error: 'empty' };

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { ok: false, error: 'invalid' };
  }

  if (url.protocol !== 'https:') return { ok: false, error: 'not-https' };
  if (url.username || url.password) return { ok: false, error: 'has-credentials' };
  if (!url.hostname) return { ok: false, error: 'invalid' };

  return { ok: true, url: trimmed };
};

/** 해커톤 범위에서는 Vercel 배포 주소를 권장합니다. */
export const isVercelAppUrl = (value: string) => {
  try {
    return new URL(value.trim()).hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
};
