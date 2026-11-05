import { describe, expect, it } from 'vitest';

import {
  BRIDGE_PREVIEW_MAX_LENGTH,
  parseParentMessage,
  parseSiteMessage,
  toOrigin,
} from './protocol';

describe('parseSiteMessage', () => {
  it('ready와 path-changed는 /로 시작하는 경로만 받는다', () => {
    expect(parseSiteMessage({ type: 'respec:ready', version: 1, path: '/shop' })).toEqual({
      type: 'respec:ready',
      version: 1,
      path: '/shop',
    });
    expect(parseSiteMessage({ type: 'respec:path-changed', path: '//evil.com' })).toBeNull();
    expect(parseSiteMessage({ type: 'respec:path-changed', path: 'shop' })).toBeNull();
  });

  it('pin-created 앵커에서 모르는 필드를 지우고 범위를 확인한다', () => {
    const message = parseSiteMessage({
      type: 'respec:pin-created',
      x: 10,
      y: 20,
      anchor: {
        page_path: '/',
        element_selector: '#cta',
        relative_x: 0.5,
        relative_y: 1,
        extra: 'x',
        location_context: { element_text: '구매', index: 0, page_x: 'x', unknown: 1 },
      },
    });

    expect(message).toEqual({
      type: 'respec:pin-created',
      x: 10,
      y: 20,
      anchor: {
        page_path: '/',
        element_selector: '#cta',
        relative_x: 0.5,
        relative_y: 1,
        location_context: { element_text: '구매', index: 0 },
      },
    });
  });

  it('잘못된 pin-created는 버린다', () => {
    const anchor = { page_path: '/', element_selector: '#a', relative_x: 0.5, relative_y: 0.5 };
    expect(
      parseSiteMessage({
        type: 'respec:pin-created',
        x: 1,
        y: 1,
        anchor: { ...anchor, relative_x: 2 },
      }),
    ).toBeNull();
    expect(
      parseSiteMessage({
        type: 'respec:pin-created',
        x: 1,
        y: 1,
        anchor: { ...anchor, element_selector: '' },
      }),
    ).toBeNull();
    expect(parseSiteMessage({ type: 'respec:pin-created', x: 1, anchor })).toBeNull();
  });

  it('pin-missing과 pin-found는 핀 id만 받는다', () => {
    expect(parseSiteMessage({ type: 'respec:pin-found', pinId: '3', extra: 1 })).toEqual({
      type: 'respec:pin-found',
      pinId: '3',
    });
    expect(parseSiteMessage({ type: 'respec:pin-missing', pinId: '3' })).toEqual({
      type: 'respec:pin-missing',
      pinId: '3',
    });
    expect(parseSiteMessage({ type: 'respec:pin-found', pinId: '' })).toBeNull();
  });

  it('respec 메시지가 아니면 null', () => {
    expect(parseSiteMessage('respec:ready')).toBeNull();
    expect(parseSiteMessage({ type: 'webpackOk' })).toBeNull();
    expect(parseSiteMessage({ type: 'respec:unknown' })).toBeNull();
    expect(parseSiteMessage({ type: 'respec:pin-clicked', pinId: 3 })).toBeNull();
  });
});

describe('parseParentMessage', () => {
  it('show-pins에서 잘못된 핀은 빼고 필요한 필드만 남긴다', () => {
    const message = parseParentMessage({
      type: 'respec:show-pins',
      selectedPinId: '1',
      pins: [
        {
          id: '1',
          number: 1,
          page_path: '/',
          element_selector: '#a',
          relative_x: 0.1,
          relative_y: 0.2,
          location_context: null,
          tone: 'quiet',
          alert: true,
          request_preview: '버튼 색을 바꿔 주세요',
          location_status: 'needs_check',
          author_email: 'a@b.c',
        },
        { id: '2', number: 2, page_path: '/', relative_x: 0, relative_y: 0 },
        {
          id: '3',
          number: 3,
          page_path: '/',
          element_selector: '#b',
          relative_x: 0,
          relative_y: 0,
          tone: 'red',
          request_preview: 'x'.repeat(500),
          location_status: 'lost',
        },
      ],
    });

    expect(message).toEqual({
      type: 'respec:show-pins',
      selectedPinId: '1',
      pins: [
        {
          id: '1',
          number: 1,
          page_path: '/',
          element_selector: '#a',
          relative_x: 0.1,
          relative_y: 0.2,
          location_context: null,
          tone: 'quiet',
          alert: true,
          request_preview: '버튼 색을 바꿔 주세요',
          location_status: 'needs_check',
        },
        {
          id: '3',
          number: 3,
          page_path: '/',
          element_selector: '#b',
          relative_x: 0,
          relative_y: 0,
          location_context: null,
          tone: 'brand',
          alert: false,
          request_preview: 'x'.repeat(BRIDGE_PREVIEW_MAX_LENGTH),
          location_status: 'located',
        },
      ],
    });
  });

  it('set-mode와 navigate 값을 확인한다', () => {
    expect(parseParentMessage({ type: 'respec:set-mode', mode: 'pin' })).toEqual({
      type: 'respec:set-mode',
      mode: 'pin',
    });
    expect(parseParentMessage({ type: 'respec:set-mode', mode: 'edit' })).toBeNull();
    expect(parseParentMessage({ type: 'respec:navigate', path: '/a', pinId: '3' })).toEqual({
      type: 'respec:navigate',
      path: '/a',
      pinId: '3',
    });
    expect(parseParentMessage({ type: 'respec:navigate', path: 'https://evil.com' })).toBeNull();
  });
});

describe('toOrigin', () => {
  it('URL의 origin을 돌려준다', () => {
    expect(toOrigin('https://shop.vercel.app/products?x=1')).toBe('https://shop.vercel.app');
    expect(toOrigin('not a url')).toBeNull();
    expect(toOrigin(null)).toBeNull();
  });
});
