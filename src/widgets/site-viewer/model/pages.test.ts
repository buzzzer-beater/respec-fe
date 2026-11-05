import { describe, expect, it } from 'vitest';

import { toSitePages } from './pages';
import type { ViewerPin } from './types';

const pin = (overrides: Partial<ViewerPin>): ViewerPin => ({
  id: '1',
  number: 1,
  pagePath: '/',
  x: 0,
  y: 0,
  status: 'open',
  ...overrides,
});

describe('toSitePages', () => {
  it('첫 화면과 지금 페이지는 핀이 없어도 넣고 /를 먼저 둔다', () => {
    expect(toSitePages([pin({ pagePath: '/shop' })], '/about')).toEqual([
      { path: '/', pinCount: 0 },
      { path: '/about', pinCount: 0 },
      { path: '/shop', pinCount: 1 },
    ]);
  });

  it('해결된 핀과 보내기 전 위치는 세지 않는다', () => {
    const pins = [
      pin({ id: '1' }),
      pin({ id: '2', status: 'resolved' }),
      pin({ id: '3', kind: 'draft' }),
      pin({ id: '4', kind: 'review', status: 'pending_review' }),
    ];
    expect(toSitePages(pins, '/')).toEqual([{ path: '/', pinCount: 2 }]);
  });
});
