import { useGetPins } from '@/entities/pin';

import { usePatchPinLocationStatus } from '../api/pin-location';
import { getLocationReport, pinLocationReports } from './report';

/**
 * 핀 요소를 찾았는지 백엔드에 알립니다. 초안 미리보기와 배포 사이트 핀 스크립트가 같이 씁니다.
 * - `reportMissing`: 요소가 DOM에 없을 때. 숨겨진 요소(모달, 탭)에는 부르지 않습니다.
 * - `reportFound`: 요소를 찾았을 때. `needs_check`였던 핀만 `located`로 되돌립니다.
 *
 * 서버 상태와 같으면 보내지 않고, 같은 핀의 같은 보고는 새로고침 전까지 한 번만 보냅니다.
 */
export const useReportPinLocation = (projectId: number) => {
  const { data: pins } = useGetPins(projectId);
  const { mutate } = usePatchPinLocationStatus(projectId);

  const report = (pinId: number, found: boolean) => {
    const current = pins?.find((pin) => pin.id === pinId)?.location_status;
    const status = getLocationReport(current, found);
    if (!status || !pinLocationReports.claim(projectId, pinId, status)) return;
    mutate(
      { pinId, status },
      { onError: () => pinLocationReports.release(projectId, pinId, status) },
    );
  };

  return {
    reportMissing: (pinId: number) => report(pinId, false),
    reportFound: (pinId: number) => report(pinId, true),
  };
};
