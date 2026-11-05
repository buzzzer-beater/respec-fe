import { describe, expect, it } from 'vitest';

import { getMarkerOffsets } from './spread';

describe('getMarkerOffsets', () => {
  it('떨어진 핀은 옮기지 않는다', () => {
    expect(
      getMarkerOffsets([
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 0, y: 100 },
      ]),
    ).toEqual([0, 0, 0]);
  });

  it('같은 자리의 핀은 뒤 핀부터 차례로 오른쪽으로 옮긴다', () => {
    expect(
      getMarkerOffsets([
        { x: 50, y: 50 },
        { x: 50, y: 50 },
        { x: 50, y: 50 },
      ]),
    ).toEqual([0, 20, 40]);
  });

  it('가까운 핀은 겹치지 않을 만큼만 옮긴다', () => {
    expect(
      getMarkerOffsets([
        { x: 10, y: 10 },
        { x: 15, y: 18 },
      ]),
    ).toEqual([0, 20]);
  });

  it('옮긴 자리에 다른 핀이 있으면 그 핀도 피한다', () => {
    expect(
      getMarkerOffsets([
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 0, y: 0 },
      ]),
    ).toEqual([0, 0, 40]);
  });

  it('간격을 바꿀 수 있다', () => {
    expect(
      getMarkerOffsets(
        [
          { x: 0, y: 0 },
          { x: 5, y: 0 },
        ],
        10,
      ),
    ).toEqual([0, 10]);
  });
});
