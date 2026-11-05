import { useMutation, useQueryClient } from '@tanstack/react-query';

import { draftQueryKeys, type ProjectDraft } from '@/entities/project';
import { put } from '@/shared/api';
import { PUBLIC_API_BASE_URL } from '@/shared/config';

export interface DraftCreateReqType {
  /** 자유 문자열. 백엔드 힌트 값은 `shop`, `landing`, `booking` */
  site_type?: string | null;
  prompt: string;
}

// 초안 생성은 동기 방식이라 최대 약 240초(백엔드의 Bedrock 응답 대기) 걸리고, nginx는 300초에 끊습니다.
const DRAFT_TIMEOUT_MS = 290_000;

// Vercel의 `/backend` rewrite는 120초에 끊기므로, 주소가 있으면 백엔드를 바로 부릅니다(백엔드가 CORS 허용).
export const putProjectDraft = (projectId: number, body: DraftCreateReqType) =>
  put<ProjectDraft>(`/projects/${projectId}/draft`, body, {
    timeout: DRAFT_TIMEOUT_MS,
    ...(PUBLIC_API_BASE_URL && { baseURL: PUBLIC_API_BASE_URL }),
  });

export const usePutProjectDraft = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, ...body }: DraftCreateReqType & { projectId: number }) =>
      putProjectDraft(projectId, body),
    // 새 초안은 미리보기 URL이 바뀌므로 응답으로 바로 덮어씁니다.
    onSuccess: (draft, { projectId }) =>
      queryClient.setQueryData(draftQueryKeys.getDraft(projectId), draft),
  });
};
