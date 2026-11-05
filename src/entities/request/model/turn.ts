import type { ProjectRole } from '@/entities/user/@x/request';

import type { ChangeRequestStatus } from './status';

/**
 * 상태마다 다음에 움직일 역할. 확인·작업은 개발자, 검수는 고객 차례이고 해결되면 아무도 아닙니다.
 * 핀 색, "내 차례" 표시, 요청 관리 열 제목이 같은 기준을 씁니다.
 */
export const CHANGE_REQUEST_TURN: Record<ChangeRequestStatus, ProjectRole | null> = {
  open: 'developer',
  reviewing: 'developer',
  in_progress: 'developer',
  pending_review: 'client',
  resolved: null,
};

/** 지금 이 역할이 움직일 차례인지. 역할을 모르면 `false`입니다. */
export function isMyTurn(status: ChangeRequestStatus, role: ProjectRole | null | undefined) {
  return role != null && CHANGE_REQUEST_TURN[status] === role;
}

/** 요청 관리 열 제목 옆에 붙이는 차례 */
export const CHANGE_REQUEST_TURN_LABEL: Record<ChangeRequestStatus, string> = {
  open: '개발자 차례',
  reviewing: '개발자 차례',
  in_progress: '개발자 차례',
  pending_review: '고객 차례',
  resolved: '완료',
};
