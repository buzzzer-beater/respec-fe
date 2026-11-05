import { describe, expect, it } from 'vitest';

import { toDraftZipFilename } from './filename';

describe('toDraftZipFilename', () => {
  it('프로젝트 이름 뒤에 -draft.zip을 붙인다', () => {
    expect(toDraftZipFilename('노트핏 랜딩')).toBe('노트핏 랜딩-draft.zip');
  });

  it('파일 이름에 쓸 수 없는 문자를 뺀다', () => {
    expect(toDraftZipFilename('a/b:c*?')).toBe('abc-draft.zip');
  });

  it('이름이 비면 기본 이름을 쓴다', () => {
    expect(toDraftZipFilename(undefined)).toBe('respec-draft.zip');
    expect(toDraftZipFilename(' / ')).toBe('respec-draft.zip');
  });
});
