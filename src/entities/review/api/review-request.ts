import { useQuery } from '@tanstack/react-query';

import { get } from '@/shared/api';
import { POLLING_INTERVAL_MS } from '@/shared/config';

import type { ReviewRequest, ReviewRequestSummary } from '../model/review-request';

export const reviewRequestQueryKeys = {
  all: (projectId: number) => ['projects', projectId, 'review-requests'] as const,
  getReviewRequests: (projectId: number) =>
    ['projects', projectId, 'review-requests', 'list'] as const,
  getReviewRequest: (projectId: number, reviewRequestId: number) =>
    ['projects', projectId, 'review-requests', 'detail', reviewRequestId] as const,
} as const;

/** 최신순입니다. */
export const getReviewRequests = (projectId: number) =>
  get<ReviewRequestSummary[]>(`/projects/${projectId}/review-requests`);

export const getReviewRequest = (projectId: number, reviewRequestId: number) =>
  get<ReviewRequest>(`/projects/${projectId}/review-requests/${reviewRequestId}`);

export const useGetReviewRequests = (projectId: number) =>
  useQuery({
    queryKey: reviewRequestQueryKeys.getReviewRequests(projectId),
    queryFn: () => getReviewRequests(projectId),
    refetchInterval: POLLING_INTERVAL_MS,
  });

/** 제출된 내용은 바뀌지 않아서 polling하지 않습니다. `reviewRequestId`가 없으면 조회하지 않습니다. */
export const useGetReviewRequest = (projectId: number, reviewRequestId: number | undefined) =>
  useQuery({
    queryKey: reviewRequestQueryKeys.getReviewRequest(projectId, reviewRequestId ?? 0),
    queryFn: () => getReviewRequest(projectId, reviewRequestId ?? 0),
    enabled: reviewRequestId !== undefined,
  });
