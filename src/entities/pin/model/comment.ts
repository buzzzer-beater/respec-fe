/** `GET`/`POST .../pins/{pin_id}/comments` 응답 */
export interface PinComment {
  id: number;
  author_id: number;
  /** 최상위 댓글은 `null` */
  parent_comment_id: number | null;
  /** 원문. 삭제된 댓글은 "삭제된 댓글입니다"로 옵니다. */
  content: string;
  /** AI 변환본. 변환 실패나 삭제된 댓글은 `null` */
  ai_plain_text: string | null;
  /** ISO 8601 */
  created_at: string;
}

/** `PATCH .../comments/{comment_id}` 응답 */
export interface EditedPinComment extends PinComment {
  /** ISO 8601 */
  updated_at: string;
}
