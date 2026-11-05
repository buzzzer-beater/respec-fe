export type DeploymentUrlError =
  'empty' | 'has-space' | 'invalid' | 'not-https' | 'has-credentials';

export type DeploymentUrlResult =
  | {
      ok: true;
      /** 저장할 주소. 경로·쿼리·해시를 뺀 origin입니다. */
      url: string;
      /** 입력에 경로·쿼리·해시가 있어서 뺐는지. 뺐으면 사용자에게 알려 줍니다. */
      droppedPath: boolean;
    }
  | { ok: false; error: DeploymentUrlError };

// demo-design `checkDeployUrl` 문구
export const DEPLOYMENT_URL_ERROR_MESSAGE: Record<DeploymentUrlError, string> = {
  empty: '배포 주소를 입력해 주세요.',
  'has-space': '주소에 공백이 들어갈 수 없어요.',
  invalid: '주소 형식을 확인해 주세요. 예) https://my-shop.vercel.app',
  'not-https': 'https:// 로 시작하는 주소만 연결할 수 있어요.',
  'has-credentials': '아이디·비밀번호가 들어간 주소는 쓸 수 없어요.',
};

/**
 * 백엔드 검증과 같은 규칙입니다: https만, 계정 정보 없는 URL.
 * 사이트 안 경로는 핀 스크립트가 알려 주므로 origin만 저장합니다(FE#80).
 */
export const validateDeploymentUrl = (value: string): DeploymentUrlResult => {
  const trimmed = value.trim();
  if (!trimmed) return { ok: false, error: 'empty' };
  if (/\s/.test(trimmed)) return { ok: false, error: 'has-space' };

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { ok: false, error: 'invalid' };
  }

  if (url.protocol !== 'https:') return { ok: false, error: 'not-https' };
  if (url.username || url.password) return { ok: false, error: 'has-credentials' };
  if (!url.hostname) return { ok: false, error: 'invalid' };

  const rest = url.pathname + url.search + url.hash;
  return { ok: true, url: url.origin, droppedPath: rest !== '/' && rest !== '' };
};

/** 칩과 안내 문구에 보여 줄 주소. 잘못된 URL이면 그대로 돌려줍니다. */
export const toDeploymentHost = (value: string) => {
  try {
    return new URL(value).host;
  } catch {
    return value;
  }
};
