import { describe, expect, it } from 'vitest';

import { hasPendingAi } from './chat-message';

describe('hasPendingAi', () => {
  it('AI 변환을 만드는 중인 항목이 하나라도 있으면 true', () => {
    expect(hasPendingAi([{ ai_status: 'completed' }, { ai_status: 'pending' }])).toBe(true);
  });

  it('완료, 실패, 생략만 있으면 false', () => {
    expect(
      hasPendingAi([{ ai_status: 'completed' }, { ai_status: 'failed' }, { ai_status: 'skipped' }]),
    ).toBe(false);
    expect(hasPendingAi([])).toBe(false);
  });
});
