import { describe, expect, it } from 'vitest';

import { validateDeploymentUrl } from './deployment-url';

describe('validateDeploymentUrl', () => {
  it.each([
    'https://my-app.vercel.app',
    'https://my-app.vercel.app/',
    '  https://my-app.vercel.app  ',
  ])('%s는 그대로 origin으로 저장한다', (value) => {
    expect(validateDeploymentUrl(value)).toEqual({
      ok: true,
      url: 'https://my-app.vercel.app',
      droppedPath: false,
    });
  });

  it.each([
    'https://my-app.vercel.app/shop',
    'https://my-app.vercel.app/?q=1',
    'https://my-app.vercel.app/#top',
  ])('%s는 경로를 빼고 origin만 남긴다', (value) => {
    expect(validateDeploymentUrl(value)).toEqual({
      ok: true,
      url: 'https://my-app.vercel.app',
      droppedPath: true,
    });
  });

  it('포트가 있으면 origin에 남긴다', () => {
    expect(validateDeploymentUrl('https://example.com:8443/a')).toMatchObject({
      url: 'https://example.com:8443',
    });
  });

  it.each([
    ['', 'empty'],
    ['   ', 'empty'],
    ['https://my app.vercel.app', 'has-space'],
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
