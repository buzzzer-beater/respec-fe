import { describe, expect, it } from 'vitest';

import { getNotificationHref } from './message';

const base = { id: 1, project_id: 7, read_at: null, created_at: '2026-11-05T00:00:00Z' };

describe('getNotificationHref', () => {
  it('검수 요청 알림은 검수 화면으로 보낸다', () => {
    expect(
      getNotificationHref({
        ...base,
        type: 'review_requested',
        review_request_id: 3,
        change_request_id: null,
      }),
    ).toBe('/projects/7/review');
  });

  it('재수정 요청 알림은 요청 관리 화면으로 보낸다', () => {
    expect(
      getNotificationHref({
        ...base,
        type: 'change_reopened',
        review_request_id: null,
        change_request_id: 5,
      }),
    ).toBe('/projects/7/requests');
  });
});
