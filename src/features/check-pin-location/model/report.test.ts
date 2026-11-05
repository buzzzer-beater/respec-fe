import { describe, expect, it } from 'vitest';

import { createReportTracker, getLocationReport } from './report';

describe('getLocationReport', () => {
  it('찾던 핀을 못 찾으면 needs_check', () => {
    expect(getLocationReport('located', false)).toBe('needs_check');
  });

  it('위치 확인 필요인 핀을 다시 찾으면 located', () => {
    expect(getLocationReport('needs_check', true)).toBe('located');
  });

  it('서버 상태와 같거나 핀을 모르면 보내지 않는다', () => {
    expect(getLocationReport('located', true)).toBeNull();
    expect(getLocationReport('needs_check', false)).toBeNull();
    expect(getLocationReport(undefined, false)).toBeNull();
  });
});

describe('createReportTracker', () => {
  it('같은 핀의 같은 보고는 한 번만 허용한다', () => {
    const tracker = createReportTracker();
    expect(tracker.claim(1, 10, 'needs_check')).toBe(true);
    expect(tracker.claim(1, 10, 'needs_check')).toBe(false);
    // 상태가 다르거나 다른 프로젝트의 핀이면 따로 셉니다.
    expect(tracker.claim(1, 10, 'located')).toBe(true);
    expect(tracker.claim(2, 10, 'needs_check')).toBe(true);
  });

  it('release하면 다시 보낼 수 있다', () => {
    const tracker = createReportTracker();
    tracker.claim(1, 10, 'needs_check');
    tracker.release(1, 10, 'needs_check');
    expect(tracker.claim(1, 10, 'needs_check')).toBe(true);
  });
});
