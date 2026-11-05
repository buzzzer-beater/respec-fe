import type { NextRequest } from 'next/server';

import {
  DRAFT_PREVIEW_CSP,
  fetchDraftPreviewHtml,
  injectDraftPreviewCsp,
  parseDraftPreviewParams,
} from '@/entities/project/index.server';

const COMMON_HEADERS = {
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
};

const ERRORS = {
  400: { code: 'VALIDATION_ERROR', message: '잘못된 미리보기 주소입니다.' },
  404: { code: 'DRAFT_NOT_FOUND', message: '초안을 찾을 수 없습니다.' },
  502: { code: 'HTTP_ERROR', message: '초안 미리보기를 불러오지 못했습니다.' },
  504: { code: 'TIMEOUT', message: '초안 미리보기 요청 시간이 초과되었습니다.' },
} as const;

const errorResponse = (status: keyof typeof ERRORS) =>
  Response.json({ error: ERRORS[status] }, { status, headers: COMMON_HEADERS });

/**
 * 초안 HTML을 서버에서 받아 CSP `<meta>`를 넣어 돌려줍니다. 브라우저는 이 HTML을 `srcdoc`으로 띄웁니다.
 * 백엔드 미리보기 응답에 CORS 헤더가 없어서 브라우저가 직접 받을 수 없습니다.
 * SSRF를 막기 위해 URL은 받지 않고 projectId와 access 키만 받아 서버 설정값으로 URL을 만듭니다.
 */
export async function GET(
  request: NextRequest,
  ctx: RouteContext<'/api/projects/[projectId]/draft-preview'>,
) {
  const { projectId } = await ctx.params;
  const params = parseDraftPreviewParams(projectId, request.nextUrl.searchParams.get('access'));
  if (!params) return errorResponse(400);

  const result = await fetchDraftPreviewHtml(params.projectId, params.access);
  if (!result.ok) return errorResponse(result.status);

  return new Response(injectDraftPreviewCsp(result.html), {
    headers: {
      ...COMMON_HEADERS,
      'Content-Type': 'text/html; charset=utf-8',
      // 이 주소를 직접 열어도 스크립트가 돌지 않고 다른 출처로 취급되게 합니다.
      'Content-Security-Policy': `${DRAFT_PREVIEW_CSP}; sandbox`,
    },
  });
}
