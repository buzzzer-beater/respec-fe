/** 수정 요청 상태. 백엔드 값 그대로입니다. */
export const CHANGE_REQUEST_STATUSES = [
  'open',
  'reviewing',
  'in_progress',
  'pending_review',
  'resolved',
] as const;

export type ChangeRequestStatus = (typeof CHANGE_REQUEST_STATUSES)[number];

/** `GET .../change-requests?status=` 값. 생략하면 `resolved`를 뺀 목록, `all`이면 전체입니다. */
export type ChangeRequestStatusFilter = ChangeRequestStatus | 'all';

/** 상태 뱃지용 라벨. 같은 탭 안의 상태도 구분합니다. */
export const CHANGE_REQUEST_STATUS_LABEL: Record<ChangeRequestStatus, string> = {
  open: '미해결',
  reviewing: '확인함',
  in_progress: '진행 중',
  pending_review: '검수 대기',
  resolved: '해결됨',
};

export function isChangeRequestStatus(value: unknown): value is ChangeRequestStatus {
  return CHANGE_REQUEST_STATUSES.includes(value as ChangeRequestStatus);
}

/** 수정 요청 목록 탭 */
export const REQUEST_TABS = ['request', 'working', 'review', 'done'] as const;

export type RequestTab = (typeof REQUEST_TABS)[number];

export const REQUEST_TAB_LABEL: Record<RequestTab, string> = {
  request: '요청',
  working: '작업중',
  review: '검수',
  done: '완료',
};

export const DEFAULT_REQUEST_TAB: RequestTab = 'request';

/** 상태 → 탭. `reviewing`(개발자가 확인함)은 아직 착수 전이라 요청 탭에 둡니다. */
const STATUS_TAB: Record<ChangeRequestStatus, RequestTab> = {
  open: 'request',
  reviewing: 'request',
  in_progress: 'working',
  pending_review: 'review',
  resolved: 'done',
};

export function getRequestTab(status: ChangeRequestStatus): RequestTab {
  return STATUS_TAB[status];
}

export function getTabStatuses(tab: RequestTab): ChangeRequestStatus[] {
  return CHANGE_REQUEST_STATUSES.filter((status) => STATUS_TAB[status] === tab);
}

/** 완료된 요청은 기본 화면에서 숨깁니다. 삭제하지 않고 완료 탭이나 "완료 보기"로 볼 수 있습니다. */
export function isHiddenByDefault(status: ChangeRequestStatus): boolean {
  return status === 'resolved';
}
