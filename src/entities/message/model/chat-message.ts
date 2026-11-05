import type { AiStatus } from '@/shared/api';

/** `GET`/`POST /projects/{id}/messages` 응답 */
export interface ChatMessage {
  id: number;
  author_id: number;
  /** 핀 카드만 공유한 메시지는 `null`. 본문과 `shared_pin_id` 중 하나 이상은 있습니다. */
  content: string | null;
  shared_pin_id: number | null;
  /** AI 변환본. 본문이 없거나 변환에 실패하면 `null` */
  ai_plain_text: string | null;
  /** 작성 직후에는 `pending`, 핀 카드만 공유하면 `skipped`입니다. */
  ai_status: AiStatus;
  /** ISO 8601 */
  created_at: string;
}

/** AI 변환을 아직 만드는 중인 항목이 있는지. 있으면 목록 전체를 다시 받아 변환본을 채웁니다. */
export const hasPendingAi = (items: readonly { ai_status: AiStatus }[]) =>
  items.some((item) => item.ai_status === 'pending');
