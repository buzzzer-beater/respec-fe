/**
 * - `review_requested`: 고객에게, 개발자가 검수를 요청함
 * - `change_reopened`: 개발자에게, 고객이 재수정을 요청함
 * - `change_created`: 개발자에게, 고객이 새 요청을 남김
 * - `change_resolved`: 개발자에게, 고객이 요청을 승인함
 */
export const NOTIFICATION_TYPES = [
  'review_requested',
  'change_reopened',
  'change_created',
  'change_resolved',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

interface NotificationBase {
  id: number;
  project_id: number;
  /** 행동한 참여자의 사용자 id. 이 필드가 생기기 전 알림은 `null` */
  actor_id: number | null;
  /** 읽지 않았으면 `null`. ISO 8601 */
  read_at: string | null;
  /** ISO 8601 */
  created_at: string;
}

/** `GET /notifications` 항목. 타입마다 이동할 대상 id가 하나씩 채워집니다. */
export type NotificationItem =
  | (NotificationBase & {
      type: 'review_requested';
      review_request_id: number;
      change_request_id: null;
    })
  | (NotificationBase & {
      type: 'change_reopened' | 'change_created' | 'change_resolved';
      review_request_id: null;
      change_request_id: number;
    });

/** `PATCH /notifications/{id}/read` 응답 */
export interface NotificationReadResult {
  id: number;
  /** ISO 8601 */
  read_at: string;
}
