import { API_BASE_URL } from '@/shared/config';

import { buildDraftPreviewUpstreamUrl } from '../model/draft-preview';

import 'server-only';

const TIMEOUT_MS = 10_000;
// 초안은 CSS가 들어간 HTML 파일 하나라 이보다 크면 비정상 응답으로 봅니다.
const MAX_HTML_LENGTH = 2_000_000;

export type DraftPreviewResult =
  { ok: true; html: string } | { ok: false; status: 404 | 502 | 504 };

/**
 * 백엔드에서 초안 HTML을 받아 옵니다. URL에 접근 키가 있으므로 로그로 남기지 않습니다.
 * 입력은 `parseDraftPreviewParams`를 통과한 값이어야 합니다.
 */
export const fetchDraftPreviewHtml = async (
  projectId: string,
  access: string,
): Promise<DraftPreviewResult> => {
  if (!API_BASE_URL) return { ok: false, status: 502 };

  let response: Response;
  try {
    response = await fetch(buildDraftPreviewUpstreamUrl(API_BASE_URL, projectId, access), {
      cache: 'no-store',
      headers: { Accept: 'text/html' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'TimeoutError';
    return { ok: false, status: isTimeout ? 504 : 502 };
  }

  // 다시 생성해서 키가 바뀌면 예전 키는 404 DRAFT_NOT_FOUND입니다.
  if (response.status === 404) return { ok: false, status: 404 };
  if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) {
    return { ok: false, status: 502 };
  }

  const html = await response.text();
  if (html.length > MAX_HTML_LENGTH) return { ok: false, status: 502 };
  return { ok: true, html };
};
