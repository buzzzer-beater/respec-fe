import { describe, expect, it } from 'vitest';

import { isVercelAppUrl, validateDeploymentUrl } from './deployment-url';

describe('validateDeploymentUrl', () => {
  it.each(['https://my-app.vercel.app', '  https://example.com/path?q=1  '])(
    '%s를 통과시킨다',
    (value) => {
      expect(validateDeploymentUrl(value)).toEqual({ ok: true, url: value.trim() });
    },
  );

  it.each([
    ['', 'empty'],
    ['   ', 'empty'],
    ['my-app.vercel.app', 'invalid'],
    ['https://', 'invalid'],
    ['http://my-app.vercel.app', 'not-https'],
    ['ftp://example.com', 'not-https'],
    ['https://user@example.com', 'has-credentials'],
    ['https://user:pass@example.com', 'has-credentials'],
    ['https://:pass@example.com', 'has-credentials'],
  ])('"%s"는 %s 오류다', (value, error) => {
    expect(validateDeploymentUrl(value)).toEqual({ ok: false, error });
  });
});

describe('isVercelAppUrl', () => {
  it.each([
    ['https://my-app.vercel.app', true],
    ['https://my-app.vercel.app/about', true],
    ['https://vercel.app', false],
    ['https://example.com', false],
    ['not a url', false],
  ])('%s는 %s', (value, expected) => {
    expect(isVercelAppUrl(value)).toBe(expected);
  });
});
