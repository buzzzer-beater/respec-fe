import type { PinSource } from '@/entities/pin/@x/request';
import type { ReviewItem } from '@/entities/review/@x/request';

import type { ChangeRequestStatus } from './status';

/** `GET .../change-requests` 항목, 생성과 상태 전이 API 응답 */
export interface ChangeRequest {
  id: number;
  created_by: number;
  /** 채팅에서 등록한 요청은 핀이 없을 수 있습니다. */
  pin_id: number | null;
  /** 연결된 핀의 사이트. 핀이 없으면(`pin_id`가 `null`) `null`입니다. */
  source: PinSource | null;
  /** 출처는 핀 댓글과 채팅 메시지 중 정확히 하나입니다. */
  source_pin_comment_id: number | null;
  source_chat_message_id: number | null;
  status: ChangeRequestStatus;
  /** AI 정리. 변환에 실패하면 `null` */
  ai_summary: string | null;
}

/** `GET .../change-requests/{id}` 응답 */
export interface ChangeRequestDetail extends ChangeRequest {
  /** 가장 최근 검수 제출 항목(배포본 반영 위치). 검수 요청 전에는 `null` */
  latest_review_item: ReviewItem | null;
}

/** `GET .../change-requests/{id}/history` 항목 */
export interface ChangeRequestHistory {
  /** 생성 기록은 `null` */
  from_status: ChangeRequestStatus | null;
  to_status: ChangeRequestStatus;
  changed_by: number;
  /** 재수정 요청(`pending_review` → `open`) 사유 */
  reason: string | null;
  /** 검수 요청으로 바뀐 경우의 검수 제출 id */
  review_request_id: number | null;
  /** ISO 8601 */
  created_at: string;
}
