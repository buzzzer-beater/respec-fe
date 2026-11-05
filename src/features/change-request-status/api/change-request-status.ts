import { useMutation, useQueryClient } from '@tanstack/react-query';

import { pinQueryKeys } from '@/entities/pin';
import { projectQueryKeys } from '@/entities/project';
import { type ChangeRequest, changeRequestQueryKeys } from '@/entities/request';
import { post } from '@/shared/api';

/** 개발자만 할 수 있는 상태 전이 */
export type DeveloperTransition = 'acknowledge' | 'start';

/** `acknowledge`: `open` → `reviewing`, `start`: `reviewing` → `in_progress`. 상태가 안 맞으면 409 */
export const postChangeRequestTransition = (
  projectId: number,
  requestId: number,
  transition: DeveloperTransition,
) => post<ChangeRequest>(`/projects/${projectId}/change-requests/${requestId}/${transition}`);

export const useChangeRequestTransition = (projectId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      transition,
    }: {
      requestId: number;
      transition: DeveloperTransition;
    }) => postChangeRequestTransition(projectId, requestId, transition),
    // 409여도 최신 상태를 다시 불러오도록 성공과 실패 모두 무효화합니다.
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: changeRequestQueryKeys.all(projectId) }),
        queryClient.invalidateQueries({ queryKey: pinQueryKeys.all(projectId) }),
        queryClient.invalidateQueries({ queryKey: projectQueryKeys.getProjects() }),
        queryClient.invalidateQueries({ queryKey: projectQueryKeys.getProject(projectId) }),
      ]),
  });
};
