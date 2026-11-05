// 미리보기 확대 배율. 브라우저 확대처럼 사이트를 크게, 작게 봅니다.
export const ZOOM_MIN = 50;
export const ZOOM_MAX = 150;
export const ZOOM_STEP = 10;

export const clampZoom = (value: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
