import type { Pin, PinLocationStatus, PinMarkerKind, PinTone } from '@/entities/pin';
import type { ChangeRequestStatus } from '@/entities/request';
import type { PinAnchor, RestorableAnchor } from '@/shared/lib/pin-engine';

// browse: 체험 모드(사이트를 평소처럼 사용), pin: 핀 모드(클릭한 위치에 핀 생성)
export type ViewerMode = 'browse' | 'pin';

/** 배포 사이트의 핀 스크립트(`respec-pin.js`) 연결 상태 */
export type PinScriptStatus = 'connecting' | 'connected' | 'disconnected';

export interface ViewerPin extends Pin {
  /** 연결된 수정 요청 상태 */
  status?: ChangeRequestStatus | null;
  /** 차례에 따른 마커 색(`getPinLook`). 없으면 메인 컬러입니다. */
  tone?: PinTone;
  /** 내가 움직일 차례라 빨간 점을 붙이는 핀 */
  alert?: boolean;
  /**
   * 마커 종류. 기본은 `pin`입니다. `review`는 배포본에 찍은 반영 위치(`latest_review_item.location`),
   * `draft`는 검수 요청에 담았지만 아직 보내지 않은 위치라 누를 수 없습니다.
   * `review`·`draft`는 핀이 아니라서 위치 확인(`needs_check`) 보고를 하지 않습니다.
   */
  kind?: PinMarkerKind;
  /** 서버에 저장된 위치 상태. 배포 사이트 핀 스크립트가 위치 보고 여부를 판단할 때 씁니다. */
  locationStatus?: PinLocationStatus;
  /** 요소 기준 위치. 초안 미리보기와 배포 사이트가 마커 위치를 계산할 때 씁니다. */
  anchor?: RestorableAnchor;
}

export interface PinPosition {
  x: number;
  y: number;
  /** 요소를 찾아 만든 앵커. 초안 미리보기와 핀 스크립트가 연결된 배포 사이트에서만 있습니다. */
  anchor?: PinAnchor;
}

/** 주소창 목록의 페이지 하나. 핀 개수는 그 페이지의 해결되지 않은 핀 수입니다. */
export interface SitePage {
  path: string;
  pinCount: number;
}

/** 브라우저 틀 위쪽 주소창 */
export interface SiteAddress {
  /** 사이트 주소 앞부분(`my-shop.vercel.app`, `draft.respec.app/morrow`) */
  host: string;
  path: string;
  /** 있으면 주소창을 눌러 페이지를 고를 수 있습니다(`toSitePages`). */
  pages?: SitePage[];
  onSelectPage?: (path: string) => void;
}

/** 사이트 안 이동 기록(뒤로/앞으로) */
export interface SiteHistoryControls {
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
}
