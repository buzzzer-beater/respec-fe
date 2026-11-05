import { describe, expect, it } from 'vitest';

import { canMoveHistory, EMPTY_SITE_HISTORY, moveHistory, visitPath } from './history';

describe('사이트 이동 기록', () => {
  it('새 경로를 쌓고 같은 경로는 다시 쌓지 않는다', () => {
    let history = visitPath(EMPTY_SITE_HISTORY, '/');
    history = visitPath(history, '/shop');
    history = visitPath(history, '/shop');
    expect(history).toEqual({ entries: ['/', '/shop'], index: 1 });
  });

  it('뒤로 간 뒤 그 경로에 도착하면 기록을 그대로 둔다', () => {
    const history = visitPath(visitPath(EMPTY_SITE_HISTORY, '/'), '/shop');
    const back = moveHistory(history, -1)!;
    expect(back.index).toBe(0);
    expect(visitPath(back, '/')).toBe(back);
    expect(canMoveHistory(back, 1)).toBe(true);
  });

  it('뒤로 간 뒤 다른 경로로 가면 앞쪽 기록을 지운다', () => {
    const history = visitPath(visitPath(EMPTY_SITE_HISTORY, '/'), '/shop');
    const next = visitPath(moveHistory(history, -1)!, '/about');
    expect(next).toEqual({ entries: ['/', '/about'], index: 1 });
    expect(canMoveHistory(next, 1)).toBe(false);
  });

  it('범위를 벗어나면 움직이지 않는다', () => {
    expect(moveHistory(EMPTY_SITE_HISTORY, -1)).toBeNull();
    expect(moveHistory(visitPath(EMPTY_SITE_HISTORY, '/'), 1)).toBeNull();
  });
});
