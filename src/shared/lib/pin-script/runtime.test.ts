import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type BridgePin, PIN_BRIDGE_VERSION, type SiteMessage } from '../pin-bridge';
import { get, mockElementsFromPoint, mockRect, render } from '../pin-engine/test-utils';
import { OVERLAY_TAG } from './overlay';
import { LOCATION_CHECK_DELAY_MS, startPinScript } from './runtime';

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
  tone: 'brand',
  alert: false,
  request_preview: null,
  location_status: 'located',
  ...overrides,
});

const locationMessages = (messages: SiteMessage[]) =>
  messages.filter(
    (message) => message.type === 'respec:pin-missing' || message.type === 'respec:pin-found',
  );

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

    expect(messages).toEqual([{ type: 'respec:ready', version: PIN_BRIDGE_VERSION, path: '/' }]);
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

  it('상태 색, 해결된 핀, 요청 내용 툴팁을 마커에 표시한다', () => {
    const { parent } = createParent();
    stop = startPinScript({ win: window, parent, allowedOrigins: [RESPEC_ORIGIN] });
    render('<button id="cta">구매</button><a id="logo">로고</a>');
    mockRect(get('#cta'), { left: 100, top: 200, width: 40, height: 20 });
    mockRect(get('#logo'), { left: 0, top: 0, width: 40, height: 20 });

    send(parent, {
      type: 'respec:show-pins',
      pins: [
        pin({ tone: 'quiet', request_preview: '<b>버튼</b> 색을 바꿔 주세요' }),
        pin({ id: '2', number: 2, element_selector: '#logo', tone: 'brand', alert: true }),
      ],
      selectedPinId: null,
    });
    vi.advanceTimersToNextFrame();

    const [first, second] = markers() as HTMLElement[];
    expect(first.getAttribute('data-tone')).toBe('quiet');
    expect(first.hasAttribute('data-alert')).toBe(false);
    expect(first.querySelector('.tip')?.textContent).toBe('<b>버튼</b> 색을 바꿔 주세요');
    expect(first.querySelector('b')).toBeNull();
    expect(first.getAttribute('aria-label')).toBe('1번 핀, <b>버튼</b> 색을 바꿔 주세요');
    expect(second.getAttribute('data-tone')).toBe('brand');
    expect(second.hasAttribute('data-alert')).toBe(true);
    expect(second.querySelector('.tip')?.textContent).toBe('');
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
    vi.advanceTimersByTime(LOCATION_CHECK_DELAY_MS);
    send(parent, { type: 'respec:show-pins', pins, selectedPinId: null });
    vi.advanceTimersByTime(LOCATION_CHECK_DELAY_MS);

    expect(locationMessages(messages)).toEqual([{ type: 'respec:pin-missing', pinId: '2' }]);
  });

  it('없다고 판정한 핀은 저장된 좌표에 위치 확인 필요 마커로 그린다', () => {
    const { parent } = createParent();
    stop = startPinScript({ win: window, parent, allowedOrigins: [RESPEC_ORIGIN] });
    const gone = pin({
      id: '2',
      number: 2,
      element_selector: '#gone',
      location_context: { page_x: 30, page_y: 40 },
    });

    send(parent, { type: 'respec:show-pins', pins: [gone], selectedPinId: null });
    vi.advanceTimersToNextFrame();
    // 늦게 나타날 수 있어서 판정 전에는 그리지 않습니다.
    expect(markers()).toHaveLength(0);

    vi.advanceTimersByTime(LOCATION_CHECK_DELAY_MS);
    vi.advanceTimersToNextFrame();

    const [marker] = markers() as HTMLElement[];
    expect(marker.hasAttribute('data-needs-check')).toBe(true);
    expect(marker.style.left).toBe('30px');
    expect(marker.style.top).toBe('40px');
    expect(marker.getAttribute('aria-label')).toBe('2번 핀, 위치 확인 필요');
  });

  it('서버가 needs_check인 핀은 요소가 없으면 바로 흐리게 그리고 다시 보고하지 않는다', () => {
    const { parent, messages } = createParent();
    stop = startPinScript({ win: window, parent, allowedOrigins: [RESPEC_ORIGIN] });

    send(parent, {
      type: 'respec:show-pins',
      pins: [pin({ element_selector: '#gone', location_status: 'needs_check' })],
      selectedPinId: null,
    });
    vi.advanceTimersToNextFrame();
    expect(markers()[0].hasAttribute('data-needs-check')).toBe(true);

    vi.advanceTimersByTime(LOCATION_CHECK_DELAY_MS);
    expect(locationMessages(messages)).toEqual([]);
  });

  it('needs_check인 핀의 요소를 찾으면 pin-found를 한 번 보낸다', () => {
    const { parent, messages } = createParent();
    stop = startPinScript({ win: window, parent, allowedOrigins: [RESPEC_ORIGIN] });
    const pins = [pin({ location_status: 'needs_check' })];

    send(parent, { type: 'respec:show-pins', pins, selectedPinId: null });
    vi.advanceTimersByTime(LOCATION_CHECK_DELAY_MS);
    send(parent, { type: 'respec:show-pins', pins, selectedPinId: null });
    vi.advanceTimersByTime(LOCATION_CHECK_DELAY_MS);
    vi.advanceTimersToNextFrame();

    expect(locationMessages(messages)).toEqual([{ type: 'respec:pin-found', pinId: '1' }]);
    expect(markers()[0].hasAttribute('data-needs-check')).toBe(false);
  });

  it('못 찾던 요소가 DOM에 나중에 나타나면 pin-found를 보낸다', async () => {
    const { parent, messages } = createParent();
    stop = startPinScript({ win: window, parent, allowedOrigins: [RESPEC_ORIGIN] });

    send(parent, {
      type: 'respec:show-pins',
      pins: [pin({ element_selector: '#late' })],
      selectedPinId: null,
    });
    vi.advanceTimersByTime(LOCATION_CHECK_DELAY_MS);

    const late = document.createElement('button');
    late.id = 'late';
    document.body.append(late);
    mockRect(late, { left: 0, top: 0, width: 10, height: 10 });
    // MutationObserver 콜백은 마이크로태스크에서 실행됩니다.
    await Promise.resolve();
    vi.advanceTimersByTime(LOCATION_CHECK_DELAY_MS);

    expect(locationMessages(messages)).toEqual([
      { type: 'respec:pin-missing', pinId: '1' },
      { type: 'respec:pin-found', pinId: '1' },
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
