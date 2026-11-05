import { clamp01 } from './number';
import { queryAll } from './selector';
import { getElementText } from './text';
import type { HiddenReason, RestorableAnchor, RestoreResult, TextCheck } from './types';

type Context = NonNullable<RestorableAnchor['location_context']>;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * 후보 중 핀의 요소를 고릅니다.
 * `index` 위치 요소(없으면 첫 번째)를 먼저 보고, 텍스트가 다르면 텍스트가 같은 다른 후보를 찾습니다.
 * 그래도 없으면 `index` 위치 요소를 `mismatch`로 돌려줍니다. 수정 요청으로 문구가 바뀌는 경우가 많아서
 * 텍스트가 다르다는 이유만으로 없음 처리하지 않고 호출부가 판단하게 둡니다.
 */
function pickCandidate(
  candidates: Element[],
  context: Context,
): { element: Element; textCheck: TextCheck } {
  const index = isFiniteNumber(context.index) ? context.index : 0;
  const preferred = candidates[index] ?? candidates[0];
  const expectedText = context.element_text;
  if (!expectedText) return { element: preferred, textCheck: 'skipped' };

  if (getElementText(preferred) === expectedText) return { element: preferred, textCheck: 'match' };
  const byText = candidates.find((candidate) => getElementText(candidate) === expectedText);
  if (byText) return { element: byText, textCheck: 'match' };
  return { element: preferred, textCheck: 'mismatch' };
}

/** 요소가 지금 보이지 않는 이유. 보이면 `null`입니다. */
function getHiddenReason(element: Element, rect: DOMRect): HiddenReason | null {
  if (element.closest('[hidden]')) return 'display-none';

  const view = element.ownerDocument.defaultView;
  if (view) {
    for (let node: Element | null = element; node; node = node.parentElement) {
      const style = view.getComputedStyle(node);
      if (style.display === 'none') return 'display-none';
      if (style.opacity !== '' && Number.parseFloat(style.opacity) === 0) return 'opacity-zero';
    }
    // visibility는 상속되므로 요소 자신의 계산값만 보면 됩니다.
    const { visibility } = view.getComputedStyle(element);
    if (visibility === 'hidden' || visibility === 'collapse') return 'visibility-hidden';
  }

  if (rect.width <= 0 || rect.height <= 0) return 'zero-size';
  return null;
}

function getFallback(context: Context) {
  const { page_x: pageX, page_y: pageY } = context;
  return isFiniteNumber(pageX) && isFiniteNumber(pageY) ? { pageX, pageY } : undefined;
}

/**
 * 저장된 앵커로 요소를 다시 찾고 핀 위치를 계산합니다.
 * - `found`: 요소가 보임. `position`에 마커를 그릴 좌표가 있습니다.
 * - `hidden`: 요소는 있지만 숨겨짐 (모달, 탭, `display: none`, 크기 0 등)
 * - `missing`: 요소가 없음. `needs_check`로 보고할 대상입니다.
 *
 * `index`, `element_text`, `page_x/page_y`는 없을 수 있으며, 없으면 첫 번째 요소를 검증 없이 씁니다.
 */
export function restoreAnchor(doc: Document, anchor: RestorableAnchor): RestoreResult {
  const context: Context = anchor.location_context ?? {};
  const candidates = queryAll(doc, anchor.element_selector);
  if (!candidates) {
    return { status: 'missing', reason: 'invalid-selector', fallback: getFallback(context) };
  }
  if (candidates.length === 0) {
    return { status: 'missing', reason: 'no-match', fallback: getFallback(context) };
  }

  const { element, textCheck } = pickCandidate(candidates, context);
  const rect = element.getBoundingClientRect();
  const hiddenReason = getHiddenReason(element, rect);
  if (hiddenReason) return { status: 'hidden', element, textCheck, reason: hiddenReason };

  const view = doc.defaultView;
  const clientX = rect.left + rect.width * clamp01(anchor.relative_x);
  const clientY = rect.top + rect.height * clamp01(anchor.relative_y);
  return {
    status: 'found',
    element,
    textCheck,
    position: {
      clientX,
      clientY,
      pageX: clientX + (view?.scrollX ?? 0),
      pageY: clientY + (view?.scrollY ?? 0),
    },
  };
}
