import { useMutation, useQueryClient } from '@tanstack/react-query';

import { draftQueryKeys, type ProjectDraft } from '@/entities/project';
import { put } from '@/shared/api';

export interface DraftCreateReqType {
  /** 자유 문자열. 백엔드 힌트 값은 `shop`, `landing`, `booking` */
  site_type?: string | null;
  prompt: string;
}

// 초안 생성은 동기 방식이라 최대 120초 걸립니다.
const DRAFT_TIMEOUT_MS = 130_000;

export const putProjectDraft = (projectId: number, body: DraftCreateReqType) =>
  put<ProjectDraft>(`/projects/${projectId}/draft`, body, { timeout: DRAFT_TIMEOUT_MS });

export const usePutProjectDraft = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, ...body }: DraftCreateReqType & { projectId: number }) =>
      putProjectDraft(projectId, body),
    // 재생성하면 미리보기 접근 키가 바뀌므로 초안을 다시 받습니다.
    onSuccess: (_, { projectId }) =>
      queryClient.invalidateQueries({ queryKey: draftQueryKeys.getDraft(projectId) }),
  });
};
