import { describe, expect, it } from 'vitest';

import { getNextActionLabel } from './next-action';

describe('getNextActionLabel', () => {
  it('개발자는 단계마다 다음 버튼 문구를 받는다', () => {
    expect(getNextActionLabel('open', 'developer')).toBe('확인 시작');
    expect(getNextActionLabel('reviewing', 'developer')).toBe('작업 시작');
    expect(getNextActionLabel('in_progress', 'developer')).toBe('검수 요청에 담기');
  });

  it('고객은 검수 대기일 때만 할 일이 있다', () => {
    expect(getNextActionLabel('pending_review', 'client')).toBe('반영 내용을 보고 승인해 주세요');
    expect(getNextActionLabel('open', 'client')).toBeNull();
  });

  it('역할을 모르면 null', () => {
    expect(getNextActionLabel('open', undefined)).toBeNull();
  });
});
