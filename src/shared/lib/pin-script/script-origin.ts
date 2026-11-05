import { PIN_SCRIPT_ORIGIN_ATTRIBUTE, PIN_SCRIPT_PATH, toOrigin } from '../pin-bridge';

/**
 * 핀 스크립트가 메시지를 주고받을 RE:SPEC origin 목록.
 * `data-respec-origin`이 있으면 그 값을, 없으면 스크립트를 내려받은 주소의 origin을 씁니다.
 */
export function getAllowedOrigins(script: HTMLScriptElement | null): string[] {
  if (!script) return [];
  const attribute = script.getAttribute(PIN_SCRIPT_ORIGIN_ATTRIBUTE);
  const candidates = attribute ? attribute.split(/[\s,]+/) : [script.src];
  const origins = candidates.flatMap((value) => toOrigin(value) ?? []);
  return Array.from(new Set(origins));
}

/**
 * 지금 실행 중인 핀 스크립트 태그. `async`나 동적으로 넣은 스크립트도 실행 중에는 `currentScript`가 있습니다.
 * 번들러가 감싸서 `currentScript`가 비어 있으면 주소로 찾습니다.
 */
export function findPinScript(doc: Document): HTMLScriptElement | null {
  const current = doc.currentScript;
  // SVG `<script>`도 `currentScript`가 될 수 있어서 태그 이름으로 확인합니다.
  if (current?.localName === 'script' && 'src' in current) return current as HTMLScriptElement;
  const scripts = Array.from(doc.querySelectorAll<HTMLScriptElement>('script[src]'));
  return scripts.find((script) => script.src.includes(PIN_SCRIPT_PATH)) ?? null;
}
