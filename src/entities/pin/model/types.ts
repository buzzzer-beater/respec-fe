// 핀은 페이지 경로 + 화면 위 위치(사이트 영역 기준 %)로 저장합니다.
export interface Pin {
  id: string;
  number: number;
  pagePath: string;
  x: number;
  y: number;
}
