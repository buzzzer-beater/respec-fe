import { useQuery } from '@tanstack/react-query';

import { get, post } from '@/shared/api';
import { POLLING_INTERVAL_MS } from '@/shared/config';

import type {
  ChangeRequest,
  ChangeRequestDetail,
  ChangeRequestHistory,
} from '../model/change-request';
import type { ChangeRequestStatusFilter } from '../model/status';

export const changeRequestQueryKeys = {
  all: (projectId: number) => ['projects', projectId, 'change-requests'] as const,
  getChangeRequests: (projectId: number, status?: ChangeRequestStatusFilter) =>
    ['projects', projectId, 'change-requests', 'list', status ?? 'unresolved'] as const,
  getChangeRequest: (projectId: number, requestId: number) =>
    ['projects', projectId, 'change-requests', 'detail', requestId] as const,
  getChangeRequestHistory: (projectId: number, requestId: number) =>
    ['projects', projectId, 'change-requests', 'detail', requestId, 'history'] as const,
} as const;

/** `status`를 생략하면 `resolved`를 뺀 목록입니다. */
export const getChangeRequests = (projectId: number, status?: ChangeRequestStatusFilter) =>
  get<ChangeRequest[]>(`/projects/${projectId}/change-requests`, { params: { status } });

export const getChangeRequest = (projectId: number, requestId: number) =>
  get<ChangeRequestDetail>(`/projects/${projectId}/change-requests/${requestId}`);

/** 상태 이력. 오래된 순입니다. */
export const getChangeRequestHistory = (projectId: number, requestId: number) =>
  get<ChangeRequestHistory[]>(`/projects/${projectId}/change-requests/${requestId}/history`);

/** 출처는 핀 댓글과 채팅 메시지 중 정확히 하나입니다. 고객만 만들 수 있습니다. */
export type ChangeRequestCreateReqType =
  { source_pin_comment_id: number } | { source_chat_message_id: number; pin_id?: number };

export const postChangeRequest = (projectId: number, body: ChangeRequestCreateReqType) =>
  post<ChangeRequest>(`/projects/${projectId}/change-requests`, body);

export const useGetChangeRequests = (projectId: number, status?: ChangeRequestStatusFilter) =>
  useQuery({
    queryKey: changeRequestQueryKeys.getChangeRequests(projectId, status),
    queryFn: () => getChangeRequests(projectId, status),
    refetchInterval: POLLING_INTERVAL_MS,
  });

export const useGetChangeRequest = (projectId: number, requestId: number) =>
  useQuery({
    queryKey: changeRequestQueryKeys.getChangeRequest(projectId, requestId),
    queryFn: () => getChangeRequest(projectId, requestId),
    refetchInterval: POLLING_INTERVAL_MS,
  });

export const useGetChangeRequestHistory = (projectId: number, requestId: number) =>
  useQuery({
    queryKey: changeRequestQueryKeys.getChangeRequestHistory(projectId, requestId),
    queryFn: () => getChangeRequestHistory(projectId, requestId),
    refetchInterval: POLLING_INTERVAL_MS,
  });
