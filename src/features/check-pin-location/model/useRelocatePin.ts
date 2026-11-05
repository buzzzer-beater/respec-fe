import { useState } from 'react';

import type { PinPosition } from '@/entities/pin';
import { toast } from '@/shared/ui';

import { usePatchPinLocation } from '../api/pin-location';

/** 위치를 다시 지정하는 중 사이트 위에 띄우는 안내(demo-design 모드 안내) */
export const getRelocateHint = (pinNumber: number) =>
  `핀 ${pinNumber}의 새 위치를 눌러 주세요 · Esc로 취소`;

/**
 * "위치 다시 지정" 상태. `start`로 옮길 핀을 고르고, 핀 모드에서 누른 위치를 `place`로 저장합니다.
 * 저장하면 백엔드가 `located`로 바꾸고 지정 상태를 끝냅니다.
 */
export const useRelocatePin = (projectId: number) => {
  const [target, setTarget] = useState<{ id: number; number: number } | null>(null);
  const patchLocation = usePatchPinLocation(projectId);

  /** `pinNumber`는 안내와 완료 알림("핀 N 위치를 옮겼어요")에 씁니다. */
  const start = (id: number, pinNumber: number) => {
    patchLocation.reset();
    setTarget({ id, number: pinNumber });
  };

  const cancel = () => {
    patchLocation.reset();
    setTarget(null);
  };

  const place = (position: PinPosition) => {
    if (!target || patchLocation.isPending) return;
    patchLocation.mutate(
      { pinId: target.id, ...position },
      {
        onSuccess: () => {
          setTarget(null);
          toast(`핀 ${target.number} 위치를 옮겼어요`);
        },
      },
    );
  };

  const errorMessage = patchLocation.error ? '위치를 옮기지 못했어요. 다시 눌러 주세요.' : null;

  return {
    /** 위치를 다시 지정하는 핀. 아니면 `null` */
    pinId: target?.id ?? null,
    start,
    cancel,
    place,
    isPending: patchLocation.isPending,
    errorMessage,
    /** `SiteViewer`의 `placingHint`로 넘길 안내. 지정 중이 아니면 `null` */
    hint: target ? (errorMessage ?? getRelocateHint(target.number)) : null,
  };
};
