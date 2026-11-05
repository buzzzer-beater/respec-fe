export const MAX_TEXT_LENGTH = 100;

/** 텍스트를 이 길이까지만 모읍니다. `body` 같은 큰 요소에서 전체 텍스트를 만들지 않기 위함입니다. */
const MAX_RAW_LENGTH = MAX_TEXT_LENGTH * 20;
const SHOW_TEXT = 0x4;
const NON_VISIBLE_TEXT_PARENTS = new Set(['script', 'style', 'noscript', 'template']);
const FALLBACK_TEXT_ATTRIBUTES = ['aria-label', 'alt', 'title', 'placeholder'];

/** 공백을 하나로 줄이고 NUL을 지운 뒤 최대 길이로 자릅니다. */
export function normalizeText(value: string, maxLength = MAX_TEXT_LENGTH): string {
  const collapsed = value.replace(/\0/g, '').replace(/\s+/g, ' ').trim();
  const chars = Array.from(collapsed);
  if (chars.length <= maxLength) return collapsed;
  return chars.slice(0, maxLength).join('').trimEnd();
}

function collectText(element: Element): string {
  const walker = element.ownerDocument.createTreeWalker(element, SHOW_TEXT);
  let text = '';
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement;
    if (parent && NON_VISIBLE_TEXT_PARENTS.has(parent.localName)) continue;
    text += node.nodeValue ?? '';
    if (text.length >= MAX_RAW_LENGTH) break;
  }
  return text;
}

/**
 * 요소를 검증할 텍스트. 텍스트가 없으면 `aria-label`, `alt`, `title`, `placeholder` 순으로 씁니다.
 * 앵커 생성과 복원이 같은 함수를 써야 비교가 맞습니다.
 */
export function getElementText(element: Element): string {
  const text = normalizeText(collectText(element));
  if (text) return text;
  for (const name of FALLBACK_TEXT_ATTRIBUTES) {
    const value = normalizeText(element.getAttribute(name) ?? '');
    if (value) return value;
  }
  return '';
}
