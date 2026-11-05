import type { ChangeRequestStatus } from '@/entities/request/@x/pin';
import type { AiStatus } from '@/shared/api';

/**
 * 핀을 남긴 사이트. 초안 핀은 초안에만, 배포본 핀은 배포본에만 그립니다.
 * 생략하면 `draft`이고, 예전 핀도 `draft`입니다.
 */
export const PIN_SOURCES = ['draft', 'deployment'] as const;

export type PinSource = (typeof PIN_SOURCES)[number];

/** 사이트 이름. 초안은 A, 배포본은 B로 부릅니다. (demo-design `SITE_LABEL`) */
export const PIN_SOURCE_LABEL: Record<PinSource, string> = {
  draft: '초안 A',
  deployment: '배포본 B',
};

/** 화면에 보여 줄 페이지 이름. 첫 화면(`/`)은 "메인", 나머지는 경로 그대로입니다. */
export const toPageLabel = (pagePath: string) => (pagePath === '/' ? '메인' : pagePath);

/** 재배포 후 핀 요소를 찾았는지. 못 찾아도 핀은 지우지 않고 `needs_check`로 둡니다. */
export const PIN_LOCATION_STATUSES = ['located', 'needs_check'] as const;

export type PinLocationStatus = (typeof PIN_LOCATION_STATUSES)[number];

export const PIN_LOCATION_STATUS_LABEL: Record<PinLocationStatus, string> = {
  located: '위치 확인됨',
  needs_check: '위치 확인 필요',
};

/** 요소를 다시 찾을 때 쓰는 보조 정보. 보낸 키만 저장되고 그대로 돌아옵니다. */
export interface PinLocationContext {
  element_text?: string | null;
  section_name?: string | null;
  /** 같은 selector가 여러 개일 때 순서 (0부터) */
  index?: number | null;
  viewport_width?: number | null;
  /** 요소를 못 찾았을 때 대신 그릴 페이지 좌표 */
  page_x?: number | null;
  page_y?: number | null;
}

/** 핀 위치. 생성(`POST /pins`)과 이동(`PATCH .../location`) 요청에 같은 필드를 씁니다. */
export interface PinPosition {
  /** `/`로 시작하는 경로. 목록 조회는 exact match */
  page_path: string;
  element_selector: string;
  /** 요소 안 상대 위치 0~1 */
  relative_x: number;
  relative_y: number;
  location_context?: PinLocationContext | null;
}

/** 핀 기본 응답 (`PATCH .../location`, `PATCH .../location-status`) */
export interface PinRecord extends PinPosition {
  id: number;
  source: PinSource;
  location_context: PinLocationContext | null;
  location_status: PinLocationStatus;
}

/** `POST /pins` 응답. 핀과 첫 댓글이 함께 만들어집니다. */
export interface CreatedPin extends PinRecord {
  first_comment_id: number;
  /** 첫 댓글의 AI 상태. 만든 직후에는 `pending`입니다. */
  ai_status: AiStatus;
  ai_plain_text: string | null;
}

/** `GET /pins`, `GET /pins/{id}` 응답. 해결되지 않은 요청을 우선해 하나만 붙습니다. */
export interface PinWithRequest extends PinRecord {
  /** 연결된 수정 요청이 없으면 `null` */
  change_request_id: number | null;
  request_status: ChangeRequestStatus | null;
  /** 첫 댓글 내용. 첫 댓글이 삭제됐으면 `null` */
  request_preview: string | null;
}

/**
 * 핀 번호. 프로젝트 안에서 만든 순서(id 오름차순)대로 1부터 매기고, 초안·배포본 핀이 번호를 함께 씁니다.
 * 반환값은 핀 id → 번호입니다.
 */
export const toPinNumbers = (pins: readonly Pick<PinRecord, 'id'>[]) =>
  new Map([...pins].sort((a, b) => a.id - b.id).map((pin, index) => [pin.id, index + 1]));
