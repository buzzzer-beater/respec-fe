import { describe, expect, it } from 'vitest';

import {
  buildDraftPreviewUpstreamUrl,
  DRAFT_PREVIEW_CSP,
  getDraftPreviewPath,
  getPreviewAccessKey,
  injectDraftPreviewCsp,
  parseDraftPreviewParams,
} from './draft-preview';

// 백엔드 `token_urlsafe(32)`와 같은 43자 키
const KEY = 'Ab3_-xYz0123456789abcdefghijklmnopqrstuvwxy';

describe('getPreviewAccessKey', () => {
  it('http, https preview_url 모두에서 access 키를 꺼낸다', () => {
    expect(
      getPreviewAccessKey(`http://respec-be.duckdns.org/projects/3/draft/preview?access=${KEY}`),
    ).toBe(KEY);
    expect(
      getPreviewAccessKey(`https://api.example.com/projects/3/draft/preview?access=${KEY}`),
    ).toBe(KEY);
  });

  it('URL이 아니거나 access가 없으면 null', () => {
    expect(getPreviewAccessKey('not a url')).toBeNull();
    expect(getPreviewAccessKey('/projects/3/draft/preview?access=' + KEY)).toBeNull();
    expect(getPreviewAccessKey('https://api.example.com/projects/3/draft/preview')).toBeNull();
  });

  it('형식이 맞지 않는 키는 null', () => {
    expect(getPreviewAccessKey('https://a.com/p?access=short')).toBeNull();
    expect(getPreviewAccessKey(`https://a.com/p?access=${KEY}%2F..`)).toBeNull();
    expect(getPreviewAccessKey(`https://a.com/p?access=${'a'.repeat(129)}`)).toBeNull();
  });
});

describe('parseDraftPreviewParams', () => {
  it('숫자 projectId와 형식이 맞는 access를 받는다', () => {
    expect(parseDraftPreviewParams('12', KEY)).toEqual({ projectId: '12', access: KEY });
  });

  it.each(['0', '-1', '1.5', '01', 'abc', '1e3', '', '12/../../admin', '1'.repeat(17)])(
    'projectId %j는 거절한다',
    (projectId) => {
      expect(parseDraftPreviewParams(projectId, KEY)).toBeNull();
    },
  );

  it.each([null, '', 'short', `${KEY}&x=1`, `${KEY}/`, `${KEY} `, '한글키'.repeat(10)])(
    'access %j는 거절한다',
    (access) => {
      expect(parseDraftPreviewParams('12', access)).toBeNull();
    },
  );
});

describe('buildDraftPreviewUpstreamUrl', () => {
  it('서버 API 주소로 백엔드 미리보기 URL을 만든다', () => {
    expect(buildDraftPreviewUpstreamUrl('http://localhost:8080/', '3', KEY)).toBe(
      `http://localhost:8080/projects/3/draft/preview?access=${KEY}`,
    );
    expect(buildDraftPreviewUpstreamUrl('https://api.example.com/v1', '3', KEY)).toBe(
      `https://api.example.com/v1/projects/3/draft/preview?access=${KEY}`,
    );
  });
});

describe('getDraftPreviewPath', () => {
  it('라우트 핸들러 경로를 만든다', () => {
    expect(getDraftPreviewPath(3, KEY)).toBe(`/api/projects/3/draft-preview?access=${KEY}`);
  });
});

describe('injectDraftPreviewCsp', () => {
  const meta = `<meta http-equiv="Content-Security-Policy" content="${DRAFT_PREVIEW_CSP}">`;

  it('<head> 맨 앞에 CSP meta를 넣는다', () => {
    expect(
      injectDraftPreviewCsp('<!doctype html><html><head lang="ko"><style></style></head></html>'),
    ).toBe(`<!doctype html><html><head lang="ko">${meta}<style></style></head></html>`);
  });

  it('<header>를 <head>로 착각하지 않는다', () => {
    expect(injectDraftPreviewCsp('<html><body><header></header></body></html>')).toBe(
      `<html><head>${meta}</head><body><header></header></body></html>`,
    );
  });

  it('<html>도 없으면 doctype 뒤에 넣는다', () => {
    expect(injectDraftPreviewCsp('<!DOCTYPE html><p>hi</p>')).toBe(
      `<!DOCTYPE html>${meta}<p>hi</p>`,
    );
    expect(injectDraftPreviewCsp('<p>hi</p>')).toBe(`${meta}<p>hi</p>`);
  });

  it('넣은 meta가 파싱 후 head 안에 들어간다', () => {
    const doc = new DOMParser().parseFromString(
      injectDraftPreviewCsp('<!doctype html><p>hi</p>'),
      'text/html',
    );
    expect(doc.head.querySelector('meta[http-equiv="Content-Security-Policy"]')).not.toBeNull();
    expect(doc.compatMode).toBe('CSS1Compat');
  });
});
