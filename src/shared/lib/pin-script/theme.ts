import type { BridgePinTone } from '../pin-bridge';

/**
 * 마커에 쓰는 `src/app/globals.css` 토큰 값. Shadow DOM 안에는 Tailwind가 없어서 값을 옮겨 둡니다.
 * 토큰을 바꾸면 여기도 바꿉니다(`theme.test.ts`가 비교합니다).
 */
export const PIN_COLORS = {
  brand: '#5647e0',
  'brand-strong': '#3f31c9',
  ink: '#18181b',
  text: '#3f3f46',
  muted: '#84848c',
  faint: '#b4b4bb',
  warn: '#c4670f',
} as const;

/** `globals.css`의 `--ease-spring`, `--ease-out-soft` */
export const PIN_EASING = {
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  'out-soft': 'cubic-bezier(0.22, 1, 0.36, 1)',
} as const;

/**
 * 톤별 채우기 색과 마우스를 올렸을 때 색. `NumberedPin`의 `TONE_CLASS`와 같습니다.
 * `hover`가 `null`이면 같은 색을 조금 어둡게(`brightness(0.9)`) 합니다.
 */
export const PIN_TONE_COLORS: Record<BridgePinTone, { fill: string; hover: string | null }> = {
  brand: { fill: PIN_COLORS.brand, hover: PIN_COLORS['brand-strong'] },
  ink: { fill: PIN_COLORS.ink, hover: PIN_COLORS.text },
  warn: { fill: PIN_COLORS.warn, hover: null },
  faint: { fill: PIN_COLORS.faint, hover: PIN_COLORS.muted },
};
