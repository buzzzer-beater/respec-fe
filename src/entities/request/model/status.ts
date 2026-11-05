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

/** 상태 뱃지와 요청 관리 칸반 열 제목에 쓰는 라벨 */
export const CHANGE_REQUEST_STATUS_LABEL: Record<ChangeRequestStatus, string> = {
  open: '미해결',
  reviewing: '확인함',
  in_progress: '진행 중',
  pending_review: '검수 대기',
  resolved: '해결됨',
};

/** 상태별 색. 핀 마커와 상태 배지가 같은 기준을 씁니다. */
export type RequestStatusTone = 'brand' | 'ink' | 'warn' | 'faint';

export const CHANGE_REQUEST_STATUS_TONE: Record<ChangeRequestStatus, RequestStatusTone> = {
  open: 'brand',
  reviewing: 'brand',
  in_progress: 'ink',
  pending_review: 'warn',
  resolved: 'faint',
};

export function isChangeRequestStatus(value: unknown): value is ChangeRequestStatus {
  return CHANGE_REQUEST_STATUSES.includes(value as ChangeRequestStatus);
}

/** 완료된 요청은 기본 화면에서 숨깁니다. 삭제하지 않고 요청 관리의 해결됨 열에서 볼 수 있습니다. */
export function isHiddenByDefault(status: ChangeRequestStatus): boolean {
  return status === 'resolved';
}
