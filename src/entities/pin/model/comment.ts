import type { AiStatus } from '@/shared/api';

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
  /** 작성·수정 직후에는 `pending`입니다. */
  ai_status: AiStatus;
  /** ISO 8601 */
  created_at: string;
  /** ISO 8601 */
  updated_at: string;
  /** 수정한 적이 있으면 `true`. 삭제된 댓글은 `false`입니다. */
  edited: boolean;
}

/** `PATCH .../comments/{comment_id}` 응답 */
export type EditedPinComment = PinComment;

/** 삭제된 댓글의 `content`. 백엔드는 소프트 삭제 후 이 문구를 돌려줍니다. */
export const DELETED_COMMENT_CONTENT = '삭제된 댓글입니다';

/** 삭제된 댓글은 문구가 바뀌고 AI 변환본이 비어 있습니다. */
export const isDeletedPinComment = ({ content, ai_plain_text }: PinComment) =>
  content === DELETED_COMMENT_CONTENT && ai_plain_text === null;
