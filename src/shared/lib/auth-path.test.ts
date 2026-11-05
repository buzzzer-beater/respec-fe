import { describe, expect, it } from 'vitest';

import { DEFAULT_AFTER_AUTH_PATH, getSafeNextPath, isPublicPath, toLoginPath } from './auth-path';

describe('getSafeNextPath', () => {
  it('같은 사이트 경로는 그대로 돌려준다', () => {
    expect(getSafeNextPath('/projects/1/viewer')).toBe('/projects/1/viewer');
    expect(getSafeNextPath('/invite?token=abc')).toBe('/invite?token=abc');
    expect(getSafeNextPath('/')).toBe('/');
  });

  it('없으면 기본 경로를 쓴다', () => {
    expect(getSafeNextPath(null)).toBe(DEFAULT_AFTER_AUTH_PATH);
    expect(getSafeNextPath(undefined)).toBe(DEFAULT_AFTER_AUTH_PATH);
    expect(getSafeNextPath('')).toBe(DEFAULT_AFTER_AUTH_PATH);
  });

  it.each([
    'https://evil.com',
    'evil.com',
    '//evil.com',
    '/\\evil.com',
    '/\t/evil.com',
    '/\n/evil.com',
    'javascript:alert(1)',
  ])('다른 사이트로 갈 수 있는 값은 막는다: %j', (next) => {
    expect(getSafeNextPath(next)).toBe(DEFAULT_AFTER_AUTH_PATH);
  });

  it('로그인/회원가입 페이지로는 돌아가지 않는다', () => {
    expect(getSafeNextPath('/login?next=%2F')).toBe(DEFAULT_AFTER_AUTH_PATH);
    expect(getSafeNextPath('/signup')).toBe(DEFAULT_AFTER_AUTH_PATH);
  });
});

describe('toLoginPath', () => {
  it('원래 경로와 쿼리를 next에 담는다', () => {
    expect(toLoginPath('/invite?token=a&b=1')).toBe('/login?next=%2Finvite%3Ftoken%3Da%26b%3D1');
  });
});

describe('isPublicPath', () => {
  it('로그인과 회원가입만 공개 페이지다', () => {
    expect(isPublicPath('/login')).toBe(true);
    expect(isPublicPath('/signup')).toBe(true);
    expect(isPublicPath('/')).toBe(false);
    expect(isPublicPath('/projects')).toBe(false);
  });
});
