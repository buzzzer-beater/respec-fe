import { clamp01, round } from './number';
import { buildSelector, isGeneratedId } from './selector';
import { getElementText, normalizeText } from './text';
import type { LocationContext, PinAnchor } from './types';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

export type FindElementOptions = {
  /**
   * 건너뛸 요소. 같은 문서에 있는 투명 레이어나 마커 Shadow DOM host를 넘기면
   * 그 요소와 자식은 무시하고 아래에 있는 요소를 찾습니다.
   */
  ignore?: Element | readonly Element[] | null;
};

export type CaptureAnchorInput = FindElementOptions & {
  /** `doc` viewport 기준 좌표. 부모 페이지의 좌표면 iframe 위치만큼 빼서 넘깁니다. */
  clientX: number;
  clientY: number;
  /** `/`로 시작하는 페이지 경로. srcdoc 문서는 `location`이 `about:srcdoc`이라 호출부에서 넘깁니다. */
  pagePath: string;
};

export type CreateAnchorInput = Omit<CaptureAnchorInput, 'ignore'> & {
  element: Element;
};

function toArray(ignore: FindElementOptions['ignore']): readonly Element[] {
  // form, select 요소도 `length`가 있어서 `'length' in`으로 구분하지 않습니다.
  return ignore ? ([] as readonly Element[]).concat(ignore) : [];
}

/** SVG 안의 `path` 같은 조각은 작고 자주 바뀌므로 바깥 `<svg>`를 앵커로 씁니다. */
function toAnchorElement(element: Element): Element {
  if (element.namespaceURI !== SVG_NAMESPACE || element.localName === 'svg') return element;
  return element.closest('svg') ?? element;
}

/**
 * 좌표 아래 요소를 찾습니다. `elementsFromPoint`를 쓰므로 무시할 요소의 스타일을 바꾸지 않습니다.
 * `pointer-events: none`인 요소는 브라우저가 이미 건너뜁니다.
 */
export function findElementAtPoint(
  doc: Document,
  clientX: number,
  clientY: number,
  options: FindElementOptions = {},
): Element | null {
  const ignored = toArray(options.ignore);
  for (const hit of doc.elementsFromPoint(clientX, clientY)) {
    if (ignored.some((node) => node.contains(hit))) continue;
    return toAnchorElement(hit);
  }
  return null;
}

function toRelative(offset: number, size: number): number {
  if (size <= 0) return 0.5;
  return round(clamp01(offset / size), 4);
}

function getSectionName(element: Element): string | undefined {
  const section = element.closest('section');
  if (!section) return undefined;
  if (section.id && !isGeneratedId(section.id)) return normalizeText(section.id);
  const heading = section.querySelector('h1, h2, h3');
  return (heading && getElementText(heading)) || undefined;
}

function buildLocationContext(
  element: Element,
  selector: string,
  clientX: number,
  clientY: number,
): LocationContext {
  const doc = element.ownerDocument;
  const view = doc.defaultView;
  const context: LocationContext = {};

  const text = getElementText(element);
  if (text) context.element_text = text;

  const sectionName = getSectionName(element);
  if (sectionName) context.section_name = sectionName;

  const index = Array.from(doc.querySelectorAll(selector)).indexOf(element);
  if (index >= 0) context.index = index;

  if (view) {
    const viewportWidth = Math.round(view.innerWidth);
    if (viewportWidth > 0) context.viewport_width = viewportWidth;
    context.page_x = Math.round(clientX + view.scrollX);
    context.page_y = Math.round(clientY + view.scrollY);
  }

  return context;
}

/** 찾은 요소와 클릭 좌표로 앵커를 만듭니다. */
export function createAnchor({
  element,
  clientX,
  clientY,
  pagePath,
}: CreateAnchorInput): PinAnchor {
  const selector = buildSelector(element);
  const rect = element.getBoundingClientRect();

  return {
    page_path: pagePath,
    element_selector: selector,
    relative_x: toRelative(clientX - rect.left, rect.width),
    relative_y: toRelative(clientY - rect.top, rect.height),
    location_context: buildLocationContext(element, selector, clientX, clientY),
  };
}

/** 좌표 아래 요소를 찾아 앵커를 만듭니다. 요소가 없으면 `null`입니다. */
export function captureAnchor(
  doc: Document,
  { clientX, clientY, pagePath, ignore }: CaptureAnchorInput,
): PinAnchor | null {
  const element = findElementAtPoint(doc, clientX, clientY, { ignore });
  if (!element) return null;
  return createAnchor({ element, clientX, clientY, pagePath });
}
