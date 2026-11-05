import type { ChangeRequestStatus } from './status';

/**
 * 상태 전이 표. 백엔드는 `from` 상태일 때만 전이하고, 아니면 409를 돌려줍니다.
 * 역할 확인은 `@/entities/user`의 `can`으로 따로 합니다.
 */
export const CHANGE_REQUEST_TRANSITIONS = {
  /** 개발자: `POST .../acknowledge` */
  acknowledge: { from: 'open', to: 'reviewing' },
  /** 개발자: `POST .../start` */
  start: { from: 'reviewing', to: 'in_progress' },
  /** 개발자: `POST /review-requests` */
  requestReview: { from: 'in_progress', to: 'pending_review' },
  /** 고객: `POST .../resolve` */
  resolve: { from: 'pending_review', to: 'resolved' },
  /** 고객: `POST .../reopen` (`reason` 필수) */
  reopen: { from: 'pending_review', to: 'open' },
} as const satisfies Record<string, { from: ChangeRequestStatus; to: ChangeRequestStatus }>;

export type ChangeRequestTransition = keyof typeof CHANGE_REQUEST_TRANSITIONS;

export function canTransition(
  status: ChangeRequestStatus,
  transition: ChangeRequestTransition,
): boolean {
  return CHANGE_REQUEST_TRANSITIONS[transition].from === status;
}

export function getAvailableTransitions(status: ChangeRequestStatus): ChangeRequestTransition[] {
  return (Object.keys(CHANGE_REQUEST_TRANSITIONS) as ChangeRequestTransition[]).filter(
    (transition) => canTransition(status, transition),
  );
}
