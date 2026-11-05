import { describe, expect, it } from 'vitest';

import { buildSelector, isGeneratedId } from './selector';
import { get, render } from './test-utils';

describe('isGeneratedId', () => {
  it.each([':r1:', ':R1H1:', ':app-r1:', '«r1»', '«R2»', '_r_1_', '_R_abc_', '_appr_3_'])(
    'React useId 형식 %s를 걸러낸다',
    (id) => {
      expect(isGeneratedId(id)).toBe(true);
    },
  );

  it.each(['radix-:r1:', 'headlessui-menu-«r3»', 'menu-_r_2_'])(
    '라이브러리가 useId를 붙인 %s를 걸러낸다',
    (id) => {
      expect(isGeneratedId(id)).toBe(true);
    },
  );

  it.each(['hero', 'product-1', 'cta_button', 'r1', 'pricing:monthly'])(
    '일반 id %s는 그대로 쓴다',
    (id) => {
      expect(isGeneratedId(id)).toBe(false);
    },
  );
});

describe('buildSelector', () => {
  it('유일한 id가 있으면 #id를 쓴다', () => {
    render('<main><button id="cta">구매</button></main>');
    expect(buildSelector(get('button'))).toBe('#cta');
  });

  it('id를 CSS.escape로 이스케이프한다', () => {
    render('<div id="1st.item">하나</div>');
    const selector = buildSelector(get('div'));
    expect(selector).toBe('#\\31 st\\.item');
    expect(document.querySelector(selector)).toBe(get('div'));
  });

  it('React useId로 만든 id는 쓰지 않는다', () => {
    render('<main><label id=":r1:">이름</label></main>');
    expect(buildSelector(get('label'))).toBe('label');
  });

  it('문서에서 유일하지 않은 id는 쓰지 않는다', () => {
    render('<p id="dup">a</p><p id="dup">b</p>');
    const second = document.querySelectorAll('p')[1];
    expect(buildSelector(second)).toBe('p:nth-of-type(2)');
  });

  it('id가 없으면 유일해질 때까지 짧은 CSS 경로를 만든다', () => {
    render('<main><p>a</p><p>b</p></main><footer><p>c</p></footer>');
    expect(buildSelector(get('main > p:nth-of-type(2)'))).toBe('p:nth-of-type(2)');
    expect(buildSelector(get('footer > p'))).toBe('footer > p');
  });

  it('id가 있는 조상을 만나면 거기서 멈춘다', () => {
    render(`
      <section id="features"><ul><li>A</li><li>B</li></ul></section>
      <ul><li>X</li><li>Y</li></ul>
    `);
    expect(buildSelector(get('#features li:nth-of-type(2)'))).toBe(
      '#features > ul > li:nth-of-type(2)',
    );
  });

  it('만든 selector는 항상 원래 요소 하나만 가리킨다', () => {
    render(`
      <header><nav><a>홈</a><a>소개</a></nav></header>
      <main>
        <section id="products">
          <ul><li><img alt="a"><span>A</span></li><li><img alt="b"><span>B</span></li></ul>
        </section>
        <section><h2>후기</h2><div><p>좋아요</p><p>최고</p></div></section>
        <div id=":r5:"><span>모달</span></div>
      </main>
    `);
    for (const element of Array.from(document.body.querySelectorAll('*'))) {
      const matches = document.querySelectorAll(buildSelector(element));
      expect(matches).toHaveLength(1);
      expect(matches[0]).toBe(element);
    }
  });

  it('body와 html도 selector로 만든다', () => {
    render('<p>a</p>');
    expect(buildSelector(document.body)).toBe('body');
    expect(buildSelector(document.documentElement)).toBe('html');
  });
});
