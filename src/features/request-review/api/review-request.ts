import { useMutation, useQueryClient } from '@tanstack/react-query';

import { type PinPosition, pinQueryKeys } from '@/entities/pin';
import { changeRequestQueryKeys } from '@/entities/request';
import { type ReviewRequest, reviewRequestQueryKeys } from '@/entities/review';
import { post } from '@/shared/api';

export interface ReviewRequestCreateReqType {
  /** 생략하면 프로젝트에 연결한 배포 주소로 저장합니다. 배포 주소가 없으면 409입니다. */
  deployment_url?: string;
  /**
   * 1개 이상, 중복 불가. 모두 `in_progress`여야 합니다.
   * `location`은 개발자가 배포본에 다시 찍은 반영 위치입니다. 원본 핀은 옮기지 않습니다.
   * `implementation_note`는 무엇을 고쳤는지 쓴 설명입니다. 빈 문자열은 거절하므로 없으면 뺍니다.
   */
  items: { change_request_id: number; location?: PinPosition; implementation_note?: string }[];
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
