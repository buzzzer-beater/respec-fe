import { describe, expect, it } from 'vitest';

import { getPinScriptTag } from './pin-script-guide';

describe('핀 스크립트 설치 안내', () => {
  it('RE:SPEC 주소로 async 스크립트 태그를 만든다', () => {
    expect(getPinScriptTag('https://respec.app')).toBe(
      '<script async src="https://respec.app/respec-pin.js"></script>',
    );
  });
});
