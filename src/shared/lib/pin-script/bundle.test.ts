import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { buildPinScript, OUTPUT } from '../../../../scripts/build-pin-script.mjs';
import { getAllowedOrigins } from './script-origin';

describe('respec-pin.js', () => {
  it('public/respec-pin.js가 지금 소스로 만든 결과와 같다 (다르면 pnpm build:pin-script)', () => {
    const committed = readFileSync(OUTPUT, 'utf8').replace(/\r\n/g, '\n');
    expect(committed).toBe(buildPinScript());
  });

  it('iframe 밖에서 실행하면 아무것도 하지 않는다', () => {
    const run = new Function('window', buildPinScript());
    const win = { document, parent: null as unknown };
    win.parent = win;

    expect(() => run(win)).not.toThrow();
    expect(document.querySelector('respec-pin-root')).toBeNull();
  });
});

describe('getAllowedOrigins', () => {
  const script = (attributes: Record<string, string>) => {
    const element = document.createElement('script');
    for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
    return element;
  };

  it('스크립트 주소의 origin을 쓴다', () => {
    expect(getAllowedOrigins(script({ src: 'https://respec.app/respec-pin.js?v=1' }))).toEqual([
      'https://respec.app',
    ]);
  });

  it('data-respec-origin이 있으면 그 값을 쓴다', () => {
    expect(
      getAllowedOrigins(
        script({
          src: 'https://cdn.example.com/respec-pin.js',
          'data-respec-origin': 'http://localhost:3000, https://respec.app/x  nope',
        }),
      ),
    ).toEqual(['http://localhost:3000', 'https://respec.app']);
  });

  it('스크립트를 못 찾으면 빈 목록', () => {
    expect(getAllowedOrigins(null)).toEqual([]);
  });
});
