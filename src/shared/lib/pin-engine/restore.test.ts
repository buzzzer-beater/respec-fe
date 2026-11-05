import { afterEach, describe, expect, it, vi } from 'vitest';

import { createAnchor } from './capture';
import { restoreAnchor } from './restore';
import { get, mockRect, mockScroll, render } from './test-utils';
import type { RestorableAnchor } from './types';

afterEach(() => {
  vi.restoreAllMocks();
  mockScroll(window, 0, 0);
});

const anchorOf = (
  element_selector: string,
  location_context?: RestorableAnchor['location_context'],
): RestorableAnchor => ({ element_selector, relative_x: 0.5, relative_y: 0.5, location_context });

function visibleRects(selector: string) {
  document.querySelectorAll(selector).forEach((element, index) => {
    mockRect(element, { left: 0, top: index * 100, width: 100, height: 50 });
  });
}

describe('restoreAnchor', () => {
  it('요소를 찾으면 화면 좌표와 문서 좌표를 계산한다', () => {
    render('<button id="cta">구매</button>');
    mockRect(get('#cta'), { left: 100, top: 200, width: 200, height: 40 });
    mockScroll(window, 10, 500);

    const result = restoreAnchor(document, {
      element_selector: '#cta',
      relative_x: 0.25,
      relative_y: 0.5,
    });

    expect(result).toEqual({
      status: 'found',
      element: get('#cta'),
      textCheck: 'skipped',
      position: { clientX: 150, clientY: 220, pageX: 160, pageY: 720 },
    });
  });

  it('저장된 상대 위치가 범위를 벗어나면 요소 안으로 자른다', () => {
    render('<p>a</p>');
    mockRect(get('p'), { left: 0, top: 0, width: 100, height: 100 });

    const result = restoreAnchor(document, {
      element_selector: 'p',
      relative_x: 2,
      relative_y: -1,
    });
    expect(result.status === 'found' && result.position).toMatchObject({
      clientX: 100,
      clientY: 0,
    });
  });

  it('index로 같은 selector 중 몇 번째인지 고른다', () => {
    render('<ul><li>A</li><li>B</li><li>C</li></ul>');
    visibleRects('li');

    const result = restoreAnchor(document, anchorOf('li', { index: 2 }));
    expect(result).toMatchObject({ status: 'found', element: get('li:nth-of-type(3)') });
  });

  it('index가 범위를 벗어나면 첫 번째 요소를 쓴다', () => {
    render('<ul><li>A</li><li>B</li></ul>');
    visibleRects('li');

    const result = restoreAnchor(document, anchorOf('li', { index: 5 }));
    expect(result).toMatchObject({ status: 'found', element: get('li:nth-of-type(1)') });
  });

  it('element_text가 맞으면 match', () => {
    render('<ul><li>A</li><li>B</li></ul>');
    visibleRects('li');

    const result = restoreAnchor(document, anchorOf('li', { index: 1, element_text: 'B' }));
    expect(result).toMatchObject({ element: get('li:nth-of-type(2)'), textCheck: 'match' });
  });

  it('index 요소의 텍스트가 다르면 텍스트가 같은 다른 후보를 고른다', () => {
    render('<ul><li>새 상품</li><li>A</li><li>B</li></ul>');
    visibleRects('li');

    const result = restoreAnchor(document, anchorOf('li', { index: 1, element_text: 'B' }));
    expect(result).toMatchObject({ element: get('li:nth-of-type(3)'), textCheck: 'match' });
  });

  it('텍스트가 같은 후보가 없으면 index 요소를 mismatch로 돌려준다', () => {
    render('<button id="cta">지금 구매하기</button>');
    visibleRects('#cta');

    const result = restoreAnchor(document, anchorOf('#cta', { element_text: '구매' }));
    expect(result).toMatchObject({
      status: 'found',
      element: get('#cta'),
      textCheck: 'mismatch',
    });
  });

  it('백엔드 응답의 null 값은 없는 값으로 다룬다', () => {
    render('<ul><li>A</li><li>B</li></ul>');
    visibleRects('li');

    expect(restoreAnchor(document, anchorOf('li', null))).toMatchObject({
      element: get('li:nth-of-type(1)'),
      textCheck: 'skipped',
    });
    expect(
      restoreAnchor(document, anchorOf('li', { index: null, element_text: null, page_x: null })),
    ).toMatchObject({ element: get('li:nth-of-type(1)'), textCheck: 'skipped' });
  });

  describe('hidden', () => {
    it.each([
      ['조상이 display: none', '<div style="display: none"><p id="t">a</p></div>', 'display-none'],
      ['hidden 속성', '<div hidden><p id="t">a</p></div>', 'display-none'],
      [
        'visibility: hidden 상속',
        '<div style="visibility: hidden"><p id="t">a</p></div>',
        'visibility-hidden',
      ],
      ['조상이 opacity: 0', '<div style="opacity: 0"><p id="t">a</p></div>', 'opacity-zero'],
    ])('%s', (_, html, reason) => {
      render(html);
      visibleRects('#t');

      expect(restoreAnchor(document, anchorOf('#t'))).toMatchObject({
        status: 'hidden',
        element: get('#t'),
        reason,
      });
    });

    it('크기가 0이면 zero-size', () => {
      render('<div id="tab-panel"><p id="t">a</p></div>');
      mockRect(get('#t'), { left: 0, top: 0, width: 0, height: 0 });

      expect(restoreAnchor(document, anchorOf('#t'))).toMatchObject({
        status: 'hidden',
        reason: 'zero-size',
      });
    });

    it('visibility: visible로 다시 보이게 한 자식은 숨겨지지 않은 것으로 본다', () => {
      render('<div style="visibility: hidden"><p id="t" style="visibility: visible">a</p></div>');
      visibleRects('#t');

      expect(restoreAnchor(document, anchorOf('#t'))).toMatchObject({ status: 'found' });
    });
  });

  describe('missing', () => {
    it('selector에 맞는 요소가 없으면 no-match, 저장된 페이지 좌표를 fallback으로 준다', () => {
      render('<p>a</p>');

      expect(restoreAnchor(document, anchorOf('#gone', { page_x: 120, page_y: 900 }))).toEqual({
        status: 'missing',
        reason: 'no-match',
        fallback: { pageX: 120, pageY: 900 },
      });
    });

    it('페이지 좌표가 없으면 fallback이 없다', () => {
      render('<p>a</p>');

      const result = restoreAnchor(document, anchorOf('#gone'));
      expect(result).toMatchObject({ status: 'missing', reason: 'no-match' });
      expect(result.status === 'missing' && result.fallback).toBeUndefined();
    });

    it('잘못된 selector면 invalid-selector', () => {
      render('<p>a</p>');

      expect(restoreAnchor(document, anchorOf('#'))).toMatchObject({
        status: 'missing',
        reason: 'invalid-selector',
      });
    });
  });

  it('만든 앵커로 복원하면 같은 지점이 나온다', () => {
    render(`
      <section id="products">
        <ul><li><span>A</span></li><li><span>B</span></li><li><span>C</span></li></ul>
      </section>
    `);
    visibleRects('#products span');
    const target = get('#products li:nth-of-type(2) span');
    mockScroll(window, 0, 40);

    const anchor = createAnchor({ element: target, clientX: 30, clientY: 110, pagePath: '/' });
    const result = restoreAnchor(document, anchor);

    expect(result).toEqual({
      status: 'found',
      element: target,
      textCheck: 'match',
      position: { clientX: 30, clientY: 110, pageX: 30, pageY: 150 },
    });
  });
});
