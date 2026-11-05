import type { PinLocationStatus } from '@/entities/pin';

/**
 * 복원 결과로 보낼 상태. 서버 상태와 같으면 보낼 필요가 없어서 `null`입니다.
 * 숨겨진 요소(모달, 탭)는 요소가 있는 것이라 여기로 넘기지 않습니다.
 */
export const getLocationReport = (
  current: PinLocationStatus | undefined,
  found: boolean,
): PinLocationStatus | null => {
  const next: PinLocationStatus = found ? 'located' : 'needs_check';
  return current && current !== next ? next : null;
};

/** 같은 핀의 같은 보고를 한 번만 보내도록 기록합니다. */
export const createReportTracker = () => {
  const reported = new Set<string>();
  const keyOf = (projectId: number, pinId: number, status: PinLocationStatus) =>
    `${projectId}:${pinId}:${status}`;

  return {
    /** 처음이면 기록하고 `true`, 이미 보냈으면 `false` */
    claim: (projectId: number, pinId: number, status: PinLocationStatus) => {
      const key = keyOf(projectId, pinId, status);
      if (reported.has(key)) return false;
      reported.add(key);
      return true;
    },
    /** 보내지 못했으면 기록을 지워 다음에 다시 보냅니다. */
    release: (projectId: number, pinId: number, status: PinLocationStatus) => {
      reported.delete(keyOf(projectId, pinId, status));
    },
  };
};

// 화면을 다시 그리거나 뷰어를 다시 열어도 새로고침 전까지는 한 번만 보냅니다.
export const pinLocationReports = createReportTracker();
