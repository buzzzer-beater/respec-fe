import { describe, expect, it } from 'vitest';

import { getPinLook } from './tone';

describe('getPinLook', () => {
  it('내 차례인 핀은 보라에 빨간 점', () => {
    expect(getPinLook('open', 'developer')).toEqual({ tone: 'brand', alert: true });
    expect(getPinLook('pending_review', 'client')).toEqual({ tone: 'brand', alert: true });
  });

  it('상대 차례인 핀은 연보라', () => {
    expect(getPinLook('open', 'client')).toEqual({ tone: 'quiet', alert: false });
    expect(getPinLook('pending_review', 'developer')).toEqual({ tone: 'quiet', alert: false });
  });

  it('해결된 핀은 회색', () => {
    expect(getPinLook('resolved', 'client')).toEqual({ tone: 'done', alert: false });
  });

  it('요청이 없거나 역할을 모르면 연보라', () => {
    expect(getPinLook(null, 'client')).toEqual({ tone: 'quiet', alert: false });
    expect(getPinLook('open', undefined)).toEqual({ tone: 'quiet', alert: false });
  });
});
