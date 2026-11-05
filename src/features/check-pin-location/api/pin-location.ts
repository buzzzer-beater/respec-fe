import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  type PinLocationStatus,
  type PinPosition,
  pinQueryKeys,
  type PinRecord,
} from '@/entities/pin';
import { patch } from '@/shared/api';

const pinPath = (projectId: number, pinId: number) => `/projects/${projectId}/pins/${pinId}`;

/** 복원 결과를 알립니다. 요소를 못 찾으면 `needs_check`, 다시 찾으면 `located` */
export const patchPinLocationStatus = (
  projectId: number,
  pinId: number,
  locationStatus: PinLocationStatus,
) =>
  patch<PinRecord>(`${pinPath(projectId, pinId)}/location-status`, {
    location_status: locationStatus,
  });

/** 핀을 새 위치로 옮깁니다. 백엔드가 `location_status`를 `located`로 바꿉니다. */
export const patchPinLocation = (projectId: number, pinId: number, body: PinPosition) =>
  patch<PinRecord>(`${pinPath(projectId, pinId)}/location`, body);

const useInvalidatePins = (projectId: number) => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: pinQueryKeys.all(projectId) });
};

export const usePatchPinLocationStatus = (projectId: number) => {
  const invalidate = useInvalidatePins(projectId);
  return useMutation({
    mutationFn: ({ pinId, status }: { pinId: number; status: PinLocationStatus }) =>
      patchPinLocationStatus(projectId, pinId, status),
    onSuccess: invalidate,
  });
};

export const usePatchPinLocation = (projectId: number) => {
  const invalidate = useInvalidatePins(projectId);
  return useMutation({
    mutationFn: ({ pinId, ...body }: PinPosition & { pinId: number }) =>
      patchPinLocation(projectId, pinId, body),
    onSuccess: invalidate,
  });
};
