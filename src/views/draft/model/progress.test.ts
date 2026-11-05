import { describe, expect, it } from 'vitest';

import { formatElapsed, getDraftProgressPercent, getDraftStepIndex } from './progress';

describe('getDraftStepIndex', () => {
  it('경과 시간에 맞는 단계를 고른다', () => {
    expect(getDraftStepIndex(0)).toBe(0);
    expect(getDraftStepIndex(9)).toBe(0);
    expect(getDraftStepIndex(10)).toBe(1);
    expect(getDraftStepIndex(40)).toBe(2);
    expect(getDraftStepIndex(75)).toBe(3);
  });

  it('마지막 단계를 넘어가지 않는다', () => {
    expect(getDraftStepIndex(600)).toBe(3);
  });
});

describe('getDraftProgressPercent', () => {
  it('0에서 시작해 시간이 지날수록 커진다', () => {
    expect(getDraftProgressPercent(0)).toBe(0);
    expect(getDraftProgressPercent(30)).toBeLessThan(getDraftProgressPercent(60));
  });

  it('오래 걸려도 끝까지 채우지 않는다', () => {
    expect(getDraftProgressPercent(10_000)).toBeLessThanOrEqual(95);
  });
});

describe('formatElapsed', () => {
  it('분:초 형식으로 바꾼다', () => {
    expect(formatElapsed(7)).toBe('0:07');
    expect(formatElapsed(102)).toBe('1:42');
  });
});
