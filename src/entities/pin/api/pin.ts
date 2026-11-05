import { useQuery } from '@tanstack/react-query';

import { get, post } from '@/shared/api';
import { POLLING_INTERVAL_MS } from '@/shared/config';

import type { CreatedPin, PinPosition, PinWithRequest } from '../model/pin';

export const pinQueryKeys = {
  all: (projectId: number) => ['projects', projectId, 'pins'] as const,
  getPins: (projectId: number) => ['projects', projectId, 'pins', 'list'] as const,
} as const;

export const getPins = (projectId: number) => get<PinWithRequest[]>(`/projects/${projectId}/pins`);

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
