import { describe, expect, it } from 'vitest';

import { getNotificationHref, getNotificationText, toNotificationPreview } from './message';

describe('getNotificationText', () => {
  it('핀 번호를 알면 문구에 넣는다', () => {
    expect(
      getNotificationText({ type: 'review_requested' }, { actor: 'dev@a.io', pinNumber: 4 }),
    ).toBe('dev@a.io 님이 핀 4 검수를 요청했어요');
    expect(
      getNotificationText({ type: 'change_resolved' }, { actor: 'me@a.io', pinNumber: 2 }),
    ).toBe('me@a.io 님이 핀 2을 승인했어요');
  });

  it('핀 번호를 모르면 번호 없이 쓴다', () => {
    expect(
      getNotificationText({ type: 'change_created' }, { actor: 'me@a.io', pinNumber: null }),
    ).toBe('me@a.io 님이 새 요청을 남겼어요');
  });
});

describe('getNotificationHref', () => {
  it('핀이 있으면 작업 화면에서 그 핀을 연다', () => {
    expect(getNotificationHref({ project_id: 7 }, 3)).toBe('/projects/7/viewer#pin-3');
    expect(getNotificationHref({ project_id: 7 }, null)).toBe('/projects/7/viewer');
  });
});

describe('toNotificationPreview', () => {
  it('18자가 넘으면 줄인다', () => {
    expect(toNotificationPreview('가'.repeat(20))).toBe(`${'가'.repeat(18)}…`);
    expect(toNotificationPreview('짧은 글')).toBe('짧은 글');
    expect(toNotificationPreview('  ')).toBeNull();
  });
});
