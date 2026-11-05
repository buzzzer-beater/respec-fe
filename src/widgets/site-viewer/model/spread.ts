export interface MarkerPoint {
  x: number;
  y: number;
}

/** 이 거리(px)보다 가까운 핀은 겹친 것으로 보고, 이만큼씩 오른쪽으로 비켜 그립니다. */
export const MARKER_GAP = 20;

/**
 * 겹치는 핀의 표시 위치를 오른쪽으로 살짝 옮길 거리(px)를 돌려줍니다. 저장 위치는 그대로입니다.
 * 앞 순서의 핀이 제자리에 남고, 뒤 핀이 이미 놓인 핀을 피할 때까지 `gap`씩 옮깁니다.
 */
export function getMarkerOffsets(points: MarkerPoint[], gap = MARKER_GAP): number[] {
  const placed: MarkerPoint[] = [];
  return points.map(({ x, y }) => {
    let dx = 0;
    const overlaps = () =>
      placed.some((point) => Math.abs(point.x - (x + dx)) < gap && Math.abs(point.y - y) < gap);
    // 핀 수보다 많이 옮길 일은 없어서 그만큼만 시도합니다.
    for (let attempt = 0; attempt < points.length && overlaps(); attempt += 1) dx += gap;
    placed.push({ x: x + dx, y });
    return dx;
  });
}
