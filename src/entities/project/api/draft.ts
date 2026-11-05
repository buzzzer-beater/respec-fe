import { useQuery } from '@tanstack/react-query';

import { ApiError, type ApiErrorCode, get, isApiError } from '@/shared/api';

import { getDraftPreviewPath, getPreviewAccessKey } from '../model/draft-preview';
import type { ProjectDraft } from '../model/project';

export const draftQueryKeys = {
  getDraft: (projectId: number) => ['projects', 'detail', projectId, 'draft'] as const,
  // 접근 키는 비밀 값이라 key에 넣지 않고, 재생성마다 바뀌는 `updated_at`을 씁니다.
  getDraftPreview: (projectId: number, updatedAt: string) =>
    ['projects', 'detail', projectId, 'draft', 'preview', updatedAt] as const,
} as const;

/** 초안이 아직 없으면(`DRAFT_NOT_FOUND`) 오류가 아니라 `null`입니다. */
export const getProjectDraft = async (projectId: number): Promise<ProjectDraft | null> => {
  try {
    return await get<ProjectDraft>(`/projects/${projectId}/draft`);
  } catch (error) {
    if (isApiError(error, 'DRAFT_NOT_FOUND')) return null;
    throw error;
  }
};

const toPreviewError = async (response: Response) => {
  const body: unknown = await response.json().catch(() => null);
  const error =
    typeof body === 'object' && body !== null && 'error' in body
      ? (body.error as { code?: ApiErrorCode; message?: string })
      : {};
  return new ApiError({
    code: error.code ?? 'UNKNOWN_ERROR',
    status: response.status,
    message: error.message ?? '초안 미리보기를 불러오지 못했습니다.',
  });
};

/** 라우트 핸들러를 거쳐 초안 HTML을 받습니다. CSP `<meta>`가 들어 있습니다. */
export const getDraftPreviewHtml = async (projectId: number, previewUrl: string) => {
  const access = getPreviewAccessKey(previewUrl);
  if (!access) {
    throw new ApiError({
      code: 'UNKNOWN_ERROR',
      status: 0,
      message: '초안 미리보기 주소 형식이 올바르지 않습니다.',
    });
  }
  const response = await fetch(getDraftPreviewPath(projectId, access), {
    cache: 'no-store',
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
  });
  if (!response.ok) throw await toPreviewError(response);
  return response.text();
};

export const useGetProjectDraft = (projectId: number) =>
  useQuery({
    queryKey: draftQueryKeys.getDraft(projectId),
    queryFn: () => getProjectDraft(projectId),
  });

/** 초안이 없으면(`null`) 요청하지 않습니다. 같은 초안은 다시 받지 않습니다. */
export const useGetDraftPreviewHtml = (projectId: number, draft: ProjectDraft | null | undefined) =>
  useQuery({
    queryKey: draftQueryKeys.getDraftPreview(projectId, draft?.updated_at ?? ''),
    queryFn: () => getDraftPreviewHtml(projectId, draft?.preview_url ?? ''),
    enabled: !!draft,
    staleTime: Infinity,
  });
