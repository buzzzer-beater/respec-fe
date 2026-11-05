/**
 * 렌더마다 바뀌는 자동 생성 id 형식입니다.
 * - React 18: `:r1:` / React 19.0~19.1: `«r1»` / React 19.2+: `_r_1_`, `_R_abc_`
 * - 라이브러리가 useId를 이어 붙인 경우: `radix-:r1:`, `headlessui-menu-_r_2_`
 */
const GENERATED_ID_PATTERNS = [
  /^:.*:$/,
  /^«.*»$/,
  /^_.*r_[0-9a-z]+_$/i,
  /:r[0-9a-z]*:/i,
  /«r[0-9a-z]*»/i,
  /_r_[0-9a-z]+_/i,
];

export function isGeneratedId(id: string): boolean {
  return GENERATED_ID_PATTERNS.some((pattern) => pattern.test(id));
}

/** 요소가 속한 문서의 `CSS.escape`를 씁니다. iframe 문서를 부모에서 다룰 때도 동작합니다. */
export function cssEscape(doc: Document, value: string): string {
  const css = doc.defaultView?.CSS ?? globalThis.CSS;
  return css.escape(value);
}

function countMatches(doc: Document, selector: string): number {
  return doc.querySelectorAll(selector).length;
}

/** 앵커로 쓸 수 있는 id. 비어 있거나, 공백이 있거나, 자동 생성이거나, 문서에서 유일하지 않으면 `null`입니다. */
export function getStableId(element: Element): string | null {
  const { id } = element;
  if (!id || /\s/.test(id) || isGeneratedId(id)) return null;
  const doc = element.ownerDocument;
  return countMatches(doc, `#${cssEscape(doc, id)}`) === 1 ? id : null;
}

function getSegment(element: Element): string {
  const doc = element.ownerDocument;
  const tag = cssEscape(doc, element.localName);
  const parent = element.parentElement;
  if (!parent) return tag;

  let position = 0;
  let sameTagCount = 0;
  for (const sibling of Array.from(parent.children)) {
    if (sibling.localName !== element.localName) continue;
    sameTagCount += 1;
    if (sibling === element) position = sameTagCount;
  }
  return sameTagCount > 1 ? `${tag}:nth-of-type(${position})` : tag;
}

/**
 * 요소의 `element_selector`를 만듭니다.
 * 1. 요소에 쓸 수 있는 id가 있으면 `#id`
 * 2. 없으면 부모로 올라가며 `tag:nth-of-type(n)`을 `>`로 잇고, 문서에서 유일해지거나
 *    id가 있는 조상을 만나면 멈춥니다. 클래스는 Tailwind 등으로 자주 바뀌므로 쓰지 않습니다.
 */
export function buildSelector(element: Element): string {
  const doc = element.ownerDocument;
  const segments: string[] = [];

  for (let current: Element | null = element; current; current = current.parentElement) {
    const id = getStableId(current);
    if (id) {
      segments.unshift(`#${cssEscape(doc, id)}`);
      break;
    }
    segments.unshift(getSegment(current));
    if (countMatches(doc, segments.join(' > ')) === 1) break;
  }

  return segments.join(' > ');
}

/** selector에 잡히는 요소 목록. 잘못된 selector면 `null`입니다. */
export function queryAll(doc: Document, selector: string): Element[] | null {
  try {
    return Array.from(doc.querySelectorAll(selector));
  } catch {
    return null;
  }
}
