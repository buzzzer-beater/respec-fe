import { useMutation, useQueryClient } from '@tanstack/react-query';

import { pinQueryKeys } from '@/entities/pin';
import { changeRequestQueryKeys } from '@/entities/request';
import { type ReviewRequest, reviewRequestQueryKeys } from '@/entities/review';
import { post } from '@/shared/api';

export interface ReviewRequestCreateReqType {
  /** https만 받습니다. */
  deployment_url: string;
  /** 1개 이상, 중복 불가. 모두 `in_progress`여야 합니다. */
  items: { change_request_id: number; implementation_note: string }[];
}

/** 개발자만 보낼 수 있습니다. 제출한 요청은 `pending_review`가 됩니다. */
export const postReviewRequest = (projectId: number, body: ReviewRequestCreateReqType) =>
  post<ReviewRequest>(`/projects/${projectId}/review-requests`, body);

export const usePostReviewRequest = (projectId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ReviewRequestCreateReqType) => postReviewRequest(projectId, body),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: changeRequestQueryKeys.all(projectId) }),
        queryClient.invalidateQueries({ queryKey: pinQueryKeys.all(projectId) }),
        queryClient.invalidateQueries({ queryKey: reviewRequestQueryKeys.all(projectId) }),
      ]),
  });
};
