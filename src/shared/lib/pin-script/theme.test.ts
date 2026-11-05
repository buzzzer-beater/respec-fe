import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { PIN_COLORS, PIN_EASING } from './theme';

const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');

const tokenValue = (name: string) => css.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1].trim();

describe('핀 스크립트 색', () => {
  it.each(Object.entries(PIN_COLORS))('--color-%s가 globals.css와 같다', (name, value) => {
    expect(tokenValue(`color-${name}`)).toBe(value);
  });

  it.each(Object.entries(PIN_EASING))('--ease-%s가 globals.css와 같다', (name, value) => {
    expect(tokenValue(`ease-${name}`)).toBe(value);
  });
});
