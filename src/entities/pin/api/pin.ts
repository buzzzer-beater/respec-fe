import { useQueries, useQuery } from '@tanstack/react-query';

import { get, post } from '@/shared/api';
import { POLLING_INTERVAL_MS } from '@/shared/config';

import type { PinComment } from '../model/comment';
import type { CreatedPin, PinPosition, PinWithRequest } from '../model/pin';

export const pinQueryKeys = {
  all: (projectId: number) => ['projects', projectId, 'pins'] as const,
  getPins: (projectId: number) => ['projects', projectId, 'pins', 'list'] as const,
  getPinComments: (projectId: number, pinId: number) =>
    ['projects', projectId, 'pins', pinId, 'comments'] as const,
} as const;

export const getPins = (projectId: number) => get<PinWithRequest[]>(`/projects/${projectId}/pins`);

export const getPinComments = (projectId: number, pinId: number) =>
  get<PinComment[]>(`/projects/${projectId}/pins/${pinId}/comments`);

export interface PinCreateReqType extends PinPosition {
  /** 첫 댓글(요청 내용) */
  request_content: string;
}

export const postPin = (projectId: number, body: PinCreateReqType) =>
  post<CreatedPin>(`/projects/${projectId}/pins`, body);

export const useGetPins = (projectId: number) =>
  useQuery({
    queryKey: pinQueryKeys.getPins(projectId),
    queryFn: () => getPins(projectId),
    refetchInterval: POLLING_INTERVAL_MS,
  });

/** 여러 핀의 댓글을 한 번에 조회합니다. 아직 받지 못한 핀은 결과에 없습니다. */
export const useGetPinCommentsByPin = (projectId: number, pinIds: number[]) =>
  useQueries({
    queries: pinIds.map((pinId) => ({
      queryKey: pinQueryKeys.getPinComments(projectId, pinId),
      queryFn: () => getPinComments(projectId, pinId),
      refetchInterval: POLLING_INTERVAL_MS,
    })),
    combine: (results) =>
      new Map(
        pinIds.flatMap((pinId, index) => {
          const { data } = results[index];
          return data ? [[pinId, data] as const] : [];
        }),
      ),
  });
