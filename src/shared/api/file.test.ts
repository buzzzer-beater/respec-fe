import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';

import { toApiError } from './error';
import { parseBlobErrorBody, parseContentDispositionFilename } from './file';

describe('parseContentDispositionFilename', () => {
  it('따옴표로 감싼 파일 이름을 읽는다', () => {
    expect(parseContentDispositionFilename('attachment; filename="draft-1.zip"')).toBe(
      'draft-1.zip',
    );
  });

  it('따옴표 없는 파일 이름을 읽는다', () => {
    expect(parseContentDispositionFilename('attachment; filename=draft-1.zip')).toBe('draft-1.zip');
  });

  it('filename*(UTF-8)을 먼저 쓴다', () => {
    expect(
      parseContentDispositionFilename(
        `attachment; filename="draft.zip"; filename*=UTF-8''%EC%B4%88%EC%95%88.zip`,
      ),
    ).toBe('초안.zip');
  });

  it('파일 이름이 없으면 null', () => {
    expect(parseContentDispositionFilename('attachment')).toBeNull();
    expect(parseContentDispositionFilename(undefined)).toBeNull();
    expect(parseContentDispositionFilename('attachment; filename=""')).toBeNull();
  });
});

describe('parseBlobErrorBody', () => {
  const toAxiosError = (data: unknown, status = 404) => {
    const headers = new AxiosHeaders();
    return new AxiosError('fail', 'ERR_BAD_REQUEST', { headers }, null, {
      data,
      status,
      statusText: '',
      headers,
      config: { headers },
    });
  };

  it('Blob 오류 본문을 읽어 오류 코드를 살린다', async () => {
    const body = { error: { code: 'DRAFT_NOT_FOUND', message: '초안 없음' }, requestId: 'r1' };
    const error = toApiError(
      await parseBlobErrorBody(
        toAxiosError(new Blob([JSON.stringify(body)], { type: 'application/json' })),
      ),
    );
    expect(error.code).toBe('DRAFT_NOT_FOUND');
    expect(error.status).toBe(404);
  });

  it('JSON이 아니면 알 수 없는 오류로 둔다', async () => {
    const error = toApiError(
      await parseBlobErrorBody(toAxiosError(new Blob(['<html>'], { type: 'text/html' }), 502)),
    );
    expect(error.code).toBe('UNKNOWN_ERROR');
    expect(error.status).toBe(502);
  });
});
