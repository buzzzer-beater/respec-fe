import { describe, expect, it } from 'vitest';

import { isMyTurn } from './turn';

describe('isMyTurn', () => {
  it.each(['open', 'reviewing', 'in_progress'] as const)('%s는 개발자 차례다', (status) => {
    expect(isMyTurn(status, 'developer')).toBe(true);
    expect(isMyTurn(status, 'client')).toBe(false);
  });

  it('검수 대기는 고객 차례다', () => {
    expect(isMyTurn('pending_review', 'client')).toBe(true);
    expect(isMyTurn('pending_review', 'developer')).toBe(false);
  });

  it('해결됐거나 역할을 모르면 아무의 차례도 아니다', () => {
    expect(isMyTurn('resolved', 'client')).toBe(false);
    expect(isMyTurn('resolved', 'developer')).toBe(false);
    expect(isMyTurn('open', undefined)).toBe(false);
  });
});
