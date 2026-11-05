/** `GET`/`POST /projects/{id}/messages` 응답 */
export interface ChatMessage {
  id: number;
  author_id: number;
  /** 핀 카드만 공유한 메시지는 `null`. 본문과 `shared_pin_id` 중 하나 이상은 있습니다. */
  content: string | null;
  shared_pin_id: number | null;
  /** AI 변환본. 본문이 없거나 변환에 실패하면 `null` */
  ai_plain_text: string | null;
  /** ISO 8601. 백엔드에 추가를 요청한 필드라 아직 오지 않을 수 있습니다. */
  created_at?: string;
}
