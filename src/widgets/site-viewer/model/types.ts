import type { Pin } from '@/entities/pin';
import type { ChangeRequestStatus } from '@/entities/request';
import type { PinAnchor, RestorableAnchor } from '@/shared/lib/pin-engine';

// browse: 체험 모드(사이트를 평소처럼 사용), pin: 핀 모드(클릭한 위치에 핀 생성)
export type ViewerMode = 'browse' | 'pin';

export interface ViewerPin extends Pin {
  muted?: boolean;
  /** 연결된 수정 요청 상태. 마커 색을 정합니다. */
  status?: ChangeRequestStatus | null;
  /** 마커에 마우스를 올리면 보여 줄 요청 내용 */
  preview?: string | null;
  /** 요소 기준 위치. DOM을 읽을 수 있는 초안 미리보기에서 마커 위치를 계산할 때 씁니다. */
  anchor?: RestorableAnchor;
}

export interface PinPosition {
  x: number;
  y: number;
  /** 요소를 찾아 만든 앵커. 초안 미리보기에서만 있습니다. */
  anchor?: PinAnchor;
}
