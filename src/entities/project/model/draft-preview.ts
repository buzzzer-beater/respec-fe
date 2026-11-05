/**
 * 백엔드 `GET P/draft/preview` 응답의 CSP와 같은 값입니다.
 * `srcdoc`에는 원래 응답 헤더가 적용되지 않아서 라우트 핸들러가 같은 값을 `<meta>`로 넣습니다.
 */
export const DRAFT_PREVIEW_CSP =
  "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'";

// 백엔드는 `secrets.token_urlsafe(32)`(43자)로 만듭니다. 길이가 바뀌어도 받도록 범위를 넉넉히 둡니다.
const ACCESS_KEY_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;
const PROJECT_ID_PATTERN = /^[1-9][0-9]{0,15}$/;

export const isValidProjectId = (value: string) => PROJECT_ID_PATTERN.test(value);

export const isValidAccessKey = (value: string) => ACCESS_KEY_PATTERN.test(value);

/**
 * `preview_url`에서 access 키만 꺼냅니다. 형식이 맞지 않으면 `null`입니다.
 * 백엔드가 `http://`로 줄 수도 있어서 URL은 쓰지 않고 키만 라우트 핸들러에 넘깁니다.
 */
export const getPreviewAccessKey = (previewUrl: string): string | null => {
  let url: URL;
  try {
    url = new URL(previewUrl);
  } catch {
    return null;
  }
  const access = url.searchParams.get('access');
  return access !== null && isValidAccessKey(access) ? access : null;
};

/** 브라우저가 초안 HTML을 받아 올 라우트 핸들러 경로 */
export const getDraftPreviewPath = (projectId: number, access: string) =>
  `/api/projects/${projectId}/draft-preview?access=${encodeURIComponent(access)}`;

/** 라우트 핸들러 입력 검증. projectId는 숫자만, access는 키 형식만 받습니다. */
export const parseDraftPreviewParams = (projectId: string, access: string | null) =>
  isValidProjectId(projectId) && access !== null && isValidAccessKey(access)
    ? { projectId, access }
    : null;

/**
 * 백엔드 미리보기 URL을 서버 설정값으로 만듭니다. 브라우저가 준 URL을 그대로 요청하지 않기 위함입니다.
 * 입력은 `parseDraftPreviewParams`를 통과한 값이어야 합니다.
 */
export const buildDraftPreviewUpstreamUrl = (
  apiBaseUrl: string,
  projectId: string,
  access: string,
) =>
  `${apiBaseUrl.replace(/\/+$/, '')}/projects/${projectId}/draft/preview?access=${encodeURIComponent(access)}`;

const CSP_META = `<meta http-equiv="Content-Security-Policy" content="${DRAFT_PREVIEW_CSP}">`;

/** `<head>` 맨 앞에 CSP `<meta>`를 넣습니다. `<head>`가 없으면 만들어 넣습니다. */
export const injectDraftPreviewCsp = (html: string) => {
  const head = /<head\b[^>]*>/i.exec(html);
  if (head) {
    const end = head.index + head[0].length;
    return `${html.slice(0, end)}${CSP_META}${html.slice(end)}`;
  }
  const root = /<html\b[^>]*>/i.exec(html);
  if (root) {
    const end = root.index + root[0].length;
    return `${html.slice(0, end)}<head>${CSP_META}</head>${html.slice(end)}`;
  }
  // doctype 앞에 넣으면 quirks 모드가 되므로 doctype 뒤에 넣습니다.
  const doctype = /^\s*<!doctype[^>]*>/i.exec(html);
  const end = doctype ? doctype[0].length : 0;
  return `${html.slice(0, end)}${CSP_META}${html.slice(end)}`;
};
