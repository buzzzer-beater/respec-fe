import { describe, expect, it } from 'vitest';

import { getThreadPlacement, splitThreadsByPage } from './placement';
import type { PinThread } from './types';

const thread = (overrides: Partial<PinThread>): PinThread => ({
  id: '1',
  pinId: 1,
  pinNumber: 1,
  source: 'draft',
  pagePath: '/',
  reviewPagePath: null,
  locationStatus: 'located',
  title: '요청',
  status: 'open',
  changeRequestId: 1,
  aiSummary: null,
  requestAuthorName: null,
  requestTimeLabel: '',
  comments: [],
  ...overrides,
});

describe('getThreadPlacement', () => {
  it('핀을 남긴 사이트에서는 원래 자리', () => {
    expect(getThreadPlacement(thread({}), 'draft')).toEqual({ pagePath: '/', byReview: false });
  });

  it('배포본에서는 초안 핀을 반영 위치로 보여 준다', () => {
    expect(getThreadPlacement(thread({ reviewPagePath: '/cart' }), 'deployment')).toEqual({
      pagePath: '/cart',
      byReview: true,
    });
    expect(getThreadPlacement(thread({}), 'deployment')).toBeNull();
  });

  it('핀 없는 요청은 어디에도 없다', () => {
    expect(getThreadPlacement(thread({ source: null, pagePath: null }), 'draft')).toBeNull();
  });
});

describe('splitThreadsByPage', () => {
  it('이 페이지 요청과 다른 곳의 해결 안 된 요청 수를 나눈다', () => {
    const threads = [
      thread({ id: 'a' }),
      thread({ id: 'b', pagePath: '/cart' }),
      thread({ id: 'c', pagePath: '/cart', status: 'resolved' }),
      thread({ id: 'd', source: null, pagePath: null }),
    ];
    const { here, elsewhere } = splitThreadsByPage(threads, 'draft', '/');
    expect(here.map(({ thread }) => thread.id)).toEqual(['a']);
    expect(elsewhere).toBe(2);
  });

  it('경로를 모르면 이 사이트에 자리가 있는 요청을 모두 이 페이지로 본다', () => {
    const threads = [thread({ id: 'a' }), thread({ id: 'b', pagePath: '/cart' })];
    expect(splitThreadsByPage(threads, 'draft', null).here).toHaveLength(2);
  });
});
