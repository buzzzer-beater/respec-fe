import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { BridgePin, SiteMessage } from '../pin-bridge';
import { get, mockElementsFromPoint, mockRect, render } from '../pin-engine/test-utils';
import { OVERLAY_TAG } from './overlay';
import { MISSING_CHECK_DELAY_MS, startPinScript } from './runtime';

const RESPEC_ORIGIN = 'https://respec.app';

const createParent = () => {
  const messages: SiteMessage[] = [];
  const parent = {
    postMessage: vi.fn((message: SiteMessage, origin: string) => {
      if (origin === RESPEC_ORIGIN) messages.push(message);
    }),
  } as unknown as Window;
  return { parent, messages };
};

const send = (parent: Window, data: unknown, origin = RESPEC_ORIGIN) => {
  window.dispatchEvent(new MessageEvent('message', { data, origin, source: parent }));
};

const pin = (overrides: Partial<BridgePin> = {}): BridgePin => ({
  id: '1',
  number: 1,
  page_path: '/',
  element_selector: '#cta',
  relative_x: 0.5,
  relative_y: 0.5,
  location_context: null,
  muted: false,
  ...overrides,
});

const markers = () =>
  Array.from(document.querySelector(OVERLAY_TAG)?.shadowRoot?.querySelectorAll('.marker') ?? []);

let stop: () => void = () => {};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame'] });
  window.history.replaceState(null, '', '/');
  render('<button id="cta">구매</button>');
  mockRect(get('#cta'), { left: 100, top: 200, width: 40, height: 20 });
});

afterEach(() => {
  stop();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('startPinScript', () => {
  it('시작하면 ready와 현재 경로를 허용한 origin으로 보낸다', () => {
    const { parent, messages } = createParent();
    stop = startPinScript({ win: window, parent, allowedOrigins: [RESPEC_ORIGIN] });

    expect(messages).toEqual([{ type: 'respec:ready', version: 1, path: '/' }]);
    expect(parent.postMessage).toHaveBeenCalledWith(expect.anything(), RESPEC_ORIGIN);
  });

  it('허용하지 않은 origin이나 다른 창의 메시지는 무시한다', () => {
    const { parent } = createParent();
    stop = startPinScript({ win: window, parent, allowedOrigins: [RESPEC_ORIGIN] });

    send(
      parent,
      { type: 'respec:show-pins', pins: [pin()], selectedPinId: null },
      'https://evil.com',
    );
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'respec:show-pins', pins: [pin()], selectedPinId: null },
        origin: RESPEC_ORIGIN,
        source: window,
      }),
    );
    vi.advanceTimersToNextFrame();

    expect(markers()).toHaveLength(0);
  });

  it('현재 경로의 핀을 Shadow DOM 마커로 그린다', () => {
    const { parent } = createParent();
    stop = startPinScript({ win: window, parent, allowedOrigins: [RESPEC_ORIGIN] });

    send(parent, {
      type: 'respec:show-pins',
      pins: [pin(), pin({ id: '2', number: 2, page_path: '/other' })],
      selectedPinId: '1',
    });
    vi.advanceTimersToNextFrame();

    const [marker] = markers() as HTMLElement[];
    expect(markers()).toHaveLength(1);
    expect(marker.textContent).toBe('1');
    expect(marker.style.left).toBe('120px');
    expect(marker.style.top).toBe('210px');
    expect(marker.hasAttribute('data-selected')).toBe(true);
  });

  it('핀 모드에서 누르면 사이트 클릭을 막고 앵커를 보낸다', () => {
    const { parent, messages } = createParent();
    stop = startPinScript({ win: window, parent, allowedOrigins: [RESPEC_ORIGIN] });
    const siteClick = vi.fn();
    get('#cta').addEventListener('click', siteClick);
    document.addEventListener('click', siteClick);
    mockElementsFromPoint(document, [document.querySelector(OVERLAY_TAG)!, get('#cta')]);

    send(parent, { type: 'respec:set-mode', mode: 'pin' });
    const layer = document.querySelector(OVERLAY_TAG)!.shadowRoot!.querySelector('.layer')!;
    layer.dispatchEvent(
      new MouseEvent('click', { bubbles: true, composed: true, clientX: 110, clientY: 205 }),
    );

    expect(siteClick).not.toHaveBeenCalled();
    expect(messages.at(-1)).toMatchObject({
      type: 'respec:pin-created',
      anchor: { page_path: '/', element_selector: '#cta', relative_x: 0.25, relative_y: 0.25 },
    });
  });

  it('마커를 누르면 pin-clicked를 보낸다', () => {
    const { parent, messages } = createParent();
    stop = startPinScript({ win: window, parent, allowedOrigins: [RESPEC_ORIGIN] });
    send(parent, { type: 'respec:show-pins', pins: [pin()], selectedPinId: null });
    vi.advanceTimersToNextFrame();

    markers()[0].dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));

    expect(messages.at(-1)).toEqual({ type: 'respec:pin-clicked', pinId: '1' });
  });

  it('요소가 DOM에 없는 핀만 잠시 뒤 pin-missing으로 한 번 보고한다', () => {
    const { parent, messages } = createParent();
    stop = startPinScript({ win: window, parent, allowedOrigins: [RESPEC_ORIGIN] });
    const pins = [pin(), pin({ id: '2', number: 2, element_selector: '#gone' })];

    send(parent, { type: 'respec:show-pins', pins, selectedPinId: null });
    vi.advanceTimersByTime(MISSING_CHECK_DELAY_MS);
    send(parent, { type: 'respec:show-pins', pins, selectedPinId: null });
    vi.advanceTimersByTime(MISSING_CHECK_DELAY_MS);

    expect(messages.filter((message) => message.type === 'respec:pin-missing')).toEqual([
      { type: 'respec:pin-missing', pinId: '2' },
    ]);
  });

  it('pushState로 경로가 바뀌면 path-changed를 보내고 이전 경로 마커를 지운다', () => {
    const { parent, messages } = createParent();
    stop = startPinScript({ win: window, parent, allowedOrigins: [RESPEC_ORIGIN] });
    send(parent, { type: 'respec:show-pins', pins: [pin()], selectedPinId: null });
    vi.advanceTimersToNextFrame();

    window.history.pushState(null, '', '/products?id=3');
    window.history.replaceState(null, '', '/products?id=4');
    vi.advanceTimersToNextFrame();

    expect(messages.filter((message) => message.type === 'respec:path-changed')).toEqual([
      { type: 'respec:path-changed', path: '/products' },
    ]);
    expect(markers()).toHaveLength(0);
  });

  it('정리하면 history와 마커 레이어를 되돌린다', () => {
    const { parent } = createParent();
    const pushState = window.history.pushState;
    stop = startPinScript({ win: window, parent, allowedOrigins: [RESPEC_ORIGIN] });
    expect(window.history.pushState).not.toBe(pushState);

    stop();
    stop = () => {};

    expect(window.history.pushState).toBe(pushState);
    expect(document.querySelector(OVERLAY_TAG)).toBeNull();
  });
});
