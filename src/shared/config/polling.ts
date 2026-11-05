// 백엔드에 WebSocket/SSE가 없어서 채팅, 핀, 수정 요청은 이 간격으로 다시 받습니다.
export const POLLING_INTERVAL_MS = 3000;

// 알림은 급하지 않아서 더 길게 잡습니다.
export const NOTIFICATION_POLLING_INTERVAL_MS = 20000;
