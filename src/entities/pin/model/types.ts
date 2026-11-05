// 핀은 페이지 경로 + 화면 위 위치(사이트 영역 기준 %)로 저장합니다.
export interface Pin {
  id: string;
  number: number;
  pagePath: string;
  x: number;
  y: number;
}

/**
 * 사이트 위 마커 종류. `pin` = 그 사이트에 찍은 핀,
 * `review` = 개발자가 검수 요청 때 배포본에 찍은 반영 위치(흰 테두리 + 검정 링),
 * `draft` = 아직 저장하거나 보내지 않은 위치(검정, 누를 수 없음)
 */
export type PinMarkerKind = 'pin' | 'review' | 'draft';
