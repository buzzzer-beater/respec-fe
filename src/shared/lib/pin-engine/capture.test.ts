import { afterEach, describe, expect, it, vi } from 'vitest';

import { captureAnchor, createAnchor, findElementAtPoint } from './capture';
import { get, mockElementsFromPoint, mockRect, mockScroll, render } from './test-utils';
import { MAX_TEXT_LENGTH } from './text';

afterEach(() => {
  vi.restoreAllMocks();
  mockScroll(window, 0, 0);
});

describe('findElementAtPoint', () => {
  it('좌표 아래 가장 위 요소를 돌려준다', () => {
    render('<button id="cta">구매</button>');
    const elementsFromPoint = mockElementsFromPoint(document, [
      get('#cta'),
      document.body,
      document.documentElement,
    ]);

    expect(findElementAtPoint(document, 10, 20)).toBe(get('#cta'));
    expect(elementsFromPoint).toHaveBeenCalledWith(10, 20);
  });

  it('무시할 요소와 그 자식은 건너뛴다', () => {
    render('<div id="overlay"><span id="marker"></span></div><button id="cta">구매</button>');
    mockElementsFromPoint(document, [get('#marker'), get('#overlay'), get('#cta')]);

    expect(findElementAtPoint(document, 0, 0, { ignore: get('#overlay') })).toBe(get('#cta'));
    expect(findElementAtPoint(document, 0, 0, { ignore: [get('#marker'), get('#overlay')] })).toBe(
      get('#cta'),
    );
  });

  it('length 속성이 있는 form 요소도 무시 대상으로 받는다', () => {
    render('<form id="overlay"></form><button id="cta">구매</button>');
    mockElementsFromPoint(document, [get('#overlay'), get('#cta')]);

    expect(findElementAtPoint(document, 0, 0, { ignore: get('#overlay') })).toBe(get('#cta'));
  });

  it('SVG 안쪽 조각을 누르면 바깥 svg를 돌려준다', () => {
    render('<button><svg id="icon"><g><path d="M0 0"></path></g></svg></button>');
    mockElementsFromPoint(document, [get('path'), get('g'), get('#icon')]);

    expect(findElementAtPoint(document, 0, 0)).toBe(get('#icon'));
  });

  it('좌표 아래 요소가 없으면 null', () => {
    mockElementsFromPoint(document, []);
    expect(findElementAtPoint(document, -10, -10)).toBeNull();
  });
});

describe('createAnchor', () => {
  it('요소 안 상대 위치와 location_context를 만든다', () => {
    render(`
      <section id="pricing">
        <ul><li>베이직</li><li><button>  프로   플랜 \n 시작하기 </button></li></ul>
      </section>
    `);
    const button = get('button');
    mockRect(button, { left: 100, top: 200, width: 200, height: 50 });
    mockScroll(window, 0, 300);

    const anchor = createAnchor({
      element: button,
      clientX: 150,
      clientY: 210,
      pagePath: '/plans',
    });

    expect(anchor).toEqual({
      page_path: '/plans',
      element_selector: 'button',
      relative_x: 0.25,
      relative_y: 0.2,
      location_context: {
        element_text: '프로 플랜 시작하기',
        section_name: 'pricing',
        index: 0,
        viewport_width: window.innerWidth,
        page_x: 150,
        page_y: 510,
      },
    });
  });

  it('요소 밖 좌표는 0~1로 자르고, 크기가 0이면 가운데로 둔다', () => {
    render('<p>a</p><hr>');
    mockRect(get('p'), { left: 0, top: 0, width: 100, height: 100 });
    mockRect(get('hr'), { left: 0, top: 0, width: 100, height: 0 });

    const outside = createAnchor({ element: get('p'), clientX: -5, clientY: 150, pagePath: '/' });
    expect([outside.relative_x, outside.relative_y]).toEqual([0, 1]);

    const flat = createAnchor({ element: get('hr'), clientX: 30, clientY: 0, pagePath: '/' });
    expect([flat.relative_x, flat.relative_y]).toEqual([0.3, 0.5]);
  });

  it('상대 위치는 소수점 넷째 자리까지 반올림한다', () => {
    render('<p>a</p>');
    mockRect(get('p'), { left: 0, top: 0, width: 3, height: 3 });

    const anchor = createAnchor({ element: get('p'), clientX: 1, clientY: 2, pagePath: '/' });
    expect([anchor.relative_x, anchor.relative_y]).toEqual([0.3333, 0.6667]);
  });

  it('element_text는 공백을 정리하고 길이를 제한한다', () => {
    render(`<p>${'가'.repeat(MAX_TEXT_LENGTH + 20)}</p>`);

    const anchor = createAnchor({ element: get('p'), clientX: 0, clientY: 0, pagePath: '/' });
    expect(anchor.location_context?.element_text).toBe('가'.repeat(MAX_TEXT_LENGTH));
  });

  it('텍스트가 없으면 alt, aria-label 등을 쓰고 script/style 내용은 뺀다', () => {
    render(`
      <img alt=" 대표 상품 ">
      <button aria-label="닫기"><svg></svg></button>
      <div id="styled"><style>.a{color:red}</style>본문</div>
    `);
    const text = (selector: string) =>
      createAnchor({ element: get(selector), clientX: 0, clientY: 0, pagePath: '/' })
        .location_context?.element_text;

    expect(text('img')).toBe('대표 상품');
    expect(text('button')).toBe('닫기');
    expect(text('#styled')).toBe('본문');
  });

  it('빈 값은 location_context에 넣지 않는다', () => {
    render('<div></div>');

    const anchor = createAnchor({ element: get('div'), clientX: 0, clientY: 0, pagePath: '/' });
    expect(anchor.location_context).not.toHaveProperty('element_text');
    expect(anchor.location_context).not.toHaveProperty('section_name');
  });

  it('section_name은 section id가 없으면 첫 h1~h3 텍스트를 쓴다', () => {
    render(`
      <section><div><h4>작은 제목</h4><h2> 고객 후기 </h2></div><p>좋아요</p></section>
      <section id=":r2:"><h3>자주 묻는 질문</h3><p>답변</p></section>
    `);
    const sectionName = (selector: string) =>
      createAnchor({ element: get(selector), clientX: 0, clientY: 0, pagePath: '/' })
        .location_context?.section_name;

    expect(sectionName('section:nth-of-type(1) p')).toBe('고객 후기');
    expect(sectionName('section:nth-of-type(2) p')).toBe('자주 묻는 질문');
  });

  it('iframe 문서의 요소도 그 문서 기준으로 계산한다', () => {
    const iframe = document.createElement('iframe');
    document.body.append(iframe);
    const frameDoc = iframe.contentDocument;
    if (!frameDoc) throw new Error('iframe 문서가 없습니다.');
    frameDoc.body.innerHTML = '<main><a id="1st">첫 상품</a></main>';
    const link = get('a', frameDoc);
    mockRect(link, { left: 0, top: 0, width: 10, height: 10 });

    const anchor = createAnchor({ element: link, clientX: 5, clientY: 5, pagePath: '/' });
    expect(anchor.element_selector).toBe('#\\31 st');
    expect(frameDoc.querySelector(anchor.element_selector)).toBe(link);
    expect(document.querySelector(anchor.element_selector)).toBeNull();
  });
});

describe('captureAnchor', () => {
  it('좌표 아래 요소를 찾아 앵커를 만든다', () => {
    render('<div id="overlay"></div><h1 id="title">환영합니다</h1>');
    mockElementsFromPoint(document, [get('#overlay'), get('#title')]);
    mockRect(get('#title'), { left: 0, top: 0, width: 400, height: 40 });

    const anchor = captureAnchor(document, {
      clientX: 100,
      clientY: 10,
      pagePath: '/',
      ignore: get('#overlay'),
    });

    expect(anchor).toMatchObject({
      page_path: '/',
      element_selector: '#title',
      relative_x: 0.25,
      relative_y: 0.25,
      location_context: { element_text: '환영합니다' },
    });
  });

  it('요소가 없으면 null', () => {
    mockElementsFromPoint(document, []);
    expect(captureAnchor(document, { clientX: 0, clientY: 0, pagePath: '/' })).toBeNull();
  });
});
