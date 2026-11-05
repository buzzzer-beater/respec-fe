import { vi } from 'vitest';

type Rect = { left: number; top: number; width: number; height: number };

/** jsdom에는 레이아웃이 없어서 요소 크기와 위치를 직접 지정합니다. */
export function mockRect(element: Element, { left, top, width, height }: Rect) {
  const view = element.ownerDocument.defaultView ?? window;
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(
    new view.DOMRect(left, top, width, height),
  );
}

/** jsdom에는 `elementsFromPoint`가 없어서 좌표와 상관없이 정해진 요소 목록을 돌려주게 합니다. */
export function mockElementsFromPoint(doc: Document, hits: Element[]) {
  const elementsFromPoint = vi.fn(() => hits);
  Object.defineProperty(doc, 'elementsFromPoint', { value: elementsFromPoint, configurable: true });
  return elementsFromPoint;
}

export function mockScroll(view: Window, scrollX: number, scrollY: number) {
  Object.defineProperty(view, 'scrollX', { value: scrollX, configurable: true });
  Object.defineProperty(view, 'scrollY', { value: scrollY, configurable: true });
}

export function render(html: string, doc: Document = document): Document {
  doc.body.innerHTML = html;
  return doc;
}

export function get(selector: string, doc: Document = document): Element {
  const element = doc.querySelector(selector);
  if (!element) throw new Error(`테스트 픽스처에 ${selector}가 없습니다.`);
  return element;
}
