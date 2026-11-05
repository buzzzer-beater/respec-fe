import { useMutation, useQueryClient } from '@tanstack/react-query';

import { pinQueryKeys } from '@/entities/pin';
import { projectQueryKeys } from '@/entities/project';
import { type ChangeRequest, changeRequestQueryKeys } from '@/entities/request';
import { post } from '@/shared/api';

/** `pending_review` → `resolved`. 상태가 안 맞으면 409 */
export const postResolveChangeRequest = (projectId: number, requestId: number) =>
  post<ChangeRequest>(`/projects/${projectId}/change-requests/${requestId}/resolve`);

export interface ChangeRequestReopenReqType {
  /** 재수정 사유. 필수 */
  reason: string;
}

/** `pending_review` → `open`. 개발자에게 `change_reopened` 알림이 갑니다. */
export const postReopenChangeRequest = (
  projectId: number,
  requestId: number,
  body: ChangeRequestReopenReqType,
) => post<ChangeRequest>(`/projects/${projectId}/change-requests/${requestId}/reopen`, body);

/** 409여도 최신 상태를 다시 불러오도록 성공과 실패 모두 무효화합니다. 미해결 수도 바뀝니다. */
const useInvalidateRequestQueries = (projectId: number) => {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: changeRequestQueryKeys.all(projectId) }),
      queryClient.invalidateQueries({ queryKey: pinQueryKeys.all(projectId) }),
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.getProjects() }),
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.getProject(projectId) }),
    ]);
};

export const useResolveChangeRequest = (projectId: number) => {
  const invalidate = useInvalidateRequestQueries(projectId);
  return useMutation({
    mutationFn: (requestId: number) => postResolveChangeRequest(projectId, requestId),
    onSettled: invalidate,
  });
};

export const useReopenChangeRequest = (projectId: number) => {
  const invalidate = useInvalidateRequestQueries(projectId);
  return useMutation({
    mutationFn: ({ requestId, ...body }: ChangeRequestReopenReqType & { requestId: number }) =>
      postReopenChangeRequest(projectId, requestId, body),
    onSettled: invalidate,
  });
};
