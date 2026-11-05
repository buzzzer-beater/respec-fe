export interface ApiResponse<T> {
  data: T;
}

/**
 * 댓글·채팅의 AI 쉬운 설명 상태. 원문을 먼저 저장하고 AI는 백그라운드에서 만듭니다.
 * - `pending`: 만드는 중 (`ai_plain_text`는 `null`). 목록을 다시 받아 확인합니다.
 * - `completed`: 완료 (`ai_plain_text`에 문자열)
 * - `failed`: 오류·시간 초과 (`null`). 5분 넘게 `pending`이면 서버가 `failed`로 바꿉니다.
 * - `skipped`: 내용 없는 핀 공유·삭제된 댓글 (`null`)
 */
export const AI_STATUSES = ['pending', 'completed', 'failed', 'skipped'] as const;

export type AiStatus = (typeof AI_STATUSES)[number];
