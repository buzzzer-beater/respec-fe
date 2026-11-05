/**
 * 요청 상세의 선택 키. 핀이 있으면 핀 id(주소의 `#pin-{id}`와 같음),
 * 채팅에서 핀 없이 등록한 요청은 `request-{요청 id}`입니다.
 */
export const toThreadId = (pinId: number | null, requestId: number) =>
  pinId === null ? `request-${requestId}` : String(pinId);
