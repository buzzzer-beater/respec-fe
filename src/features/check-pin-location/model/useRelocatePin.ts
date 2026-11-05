import { useState } from 'react';

import type { PinPosition } from '@/entities/pin';

import { usePatchPinLocation } from '../api/pin-location';

/**
 * "위치 다시 지정" 상태. `start`로 옮길 핀을 고르고, 핀 모드에서 누른 위치를 `place`로 저장합니다.
 * 저장하면 백엔드가 `located`로 바꾸고 지정 상태를 끝냅니다.
 */
export const useRelocatePin = (projectId: number) => {
  const [pinId, setPinId] = useState<number | null>(null);
  const patchLocation = usePatchPinLocation(projectId);

  const start = (id: number) => {
    patchLocation.reset();
    setPinId(id);
  };

  const cancel = () => {
    patchLocation.reset();
    setPinId(null);
  };

  const place = (position: PinPosition) => {
    if (pinId === null || patchLocation.isPending) return;
    patchLocation.mutate({ pinId, ...position }, { onSuccess: () => setPinId(null) });
  };

  return {
    /** 위치를 다시 지정하는 핀. 아니면 `null` */
    pinId,
    start,
    cancel,
    place,
    isPending: patchLocation.isPending,
    errorMessage: patchLocation.error ? '위치를 옮기지 못했어요. 다시 눌러 주세요.' : null,
  };
};
