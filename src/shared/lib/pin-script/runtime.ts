import {
  type BridgePin,
  isPagePath,
  parseParentMessage,
  PIN_BRIDGE_VERSION,
  type SiteMessage,
} from '../pin-bridge';
import { createAnchor, findElementAtPoint, restoreAnchor } from '../pin-engine';
import { getPagePath, watchPagePath } from './history';
import { createOverlay, type OverlayMarker } from './overlay';

/** 화면을 그린 뒤 요소가 늦게 나타나는 경우(데이터 로딩, 하이드레이션)를 기다렸다가 없음을 판정합니다. */
export const MISSING_CHECK_DELAY_MS = 2000;

/** 핀 모드에서 사이트로 전달되지 않게 막을 이벤트. 스크롤(`wheel`)은 막지 않습니다. */
const BLOCKED_EVENTS = [
  'click',
  'dblclick',
  'auxclick',
  'contextmenu',
  'pointerdown',
  'pointerup',
  'pointermove',
  'pointerover',
  'pointerout',
  'mousedown',
  'mouseup',
  'mousemove',
  'mouseover',
  'mouseout',
  'touchstart',
  'touchend',
] as const;

export type PinScriptOptions = {
  win: Window;
  /** 메시지를 보낼 워크스페이스 창 (`window.parent`) */
  parent: Window;
  /** 메시지를 주고받을 RE:SPEC origin 목록 */
  allowedOrigins: readonly string[];
};

/**
 * 배포 사이트 iframe 안에서 핀 엔진을 실행합니다.
 * - 부모가 보낸 핀을 Shadow DOM 마커로 그리고, 스크롤/크기/DOM 변경 때 위치를 다시 계산합니다.
 * - 핀 모드에서는 투명 레이어로 사이트 클릭을 막고, 누른 위치 아래 요소로 앵커를 만듭니다.
 * - 경로가 바뀌면 부모에게 알립니다.
 * 정리 함수를 돌려줍니다.
 */
export function startPinScript({ win, parent, allowedOrigins }: PinScriptOptions): () => void {
  const doc = win.document;
  const overlay = createOverlay(doc);
  let mode: 'browse' | 'pin' = 'browse';
  let path = getPagePath(win);
  let pins: BridgePin[] = [];
  let selectedPinId: string | null = null;
  /** 경로를 옮긴 뒤 핀 목록을 받으면 스크롤할 핀 */
  let pendingScrollPinId: string | null = null;
  const reportedMissing = new Set<string>();
  let frame = 0;
  let missingTimer: number | undefined;

  const post = (message: SiteMessage) => {
    // 받는 쪽 origin이 다르면 브라우저가 버리므로, 허용한 origin마다 보냅니다.
    for (const origin of allowedOrigins) parent.postMessage(message, origin);
  };

  const currentPins = () => pins.filter((pin) => pin.page_path === path);

  const render = () => {
    frame = 0;
    const markers: OverlayMarker[] = [];
    for (const pin of currentPins()) {
      const result = restoreAnchor(doc, pin);
      if (result.status !== 'found') continue;
      markers.push({
        pinId: pin.id,
        number: pin.number,
        clientX: result.position.clientX,
        clientY: result.position.clientY,
        muted: pin.muted,
        selected: pin.id === selectedPinId,
      });
    }
    overlay.render(markers);
  };

  const scheduleRender = () => {
    if (!frame) frame = win.requestAnimationFrame(render);
  };

  // DOM에 요소가 아예 없는 핀만 보고합니다. 숨겨진 요소(모달, 탭)는 보고하지 않습니다.
  const scheduleMissingCheck = () => {
    win.clearTimeout(missingTimer);
    missingTimer = win.setTimeout(() => {
      for (const pin of currentPins()) {
        const key = `${path}\n${pin.id}`;
        if (reportedMissing.has(key)) continue;
        if (restoreAnchor(doc, pin).status !== 'missing') continue;
        reportedMissing.add(key);
        post({ type: 'respec:pin-missing', pinId: pin.id });
      }
    }, MISSING_CHECK_DELAY_MS);
  };

  const scrollToPin = (pinId: string) => {
    const pin = currentPins().find((item) => item.id === pinId);
    if (!pin) return false;
    const result = restoreAnchor(doc, pin);
    if (result.status !== 'found') return true;
    // 마커를 눌러 고른 경우처럼 이미 화면 안에 있으면 스크롤하지 않습니다.
    const { clientY } = result.position;
    if (clientY < 0 || clientY > win.innerHeight) {
      result.element.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    return true;
  };

  const handleMessage = (event: MessageEvent) => {
    if (event.source !== parent || !allowedOrigins.includes(event.origin)) return;
    const message = parseParentMessage(event.data);
    if (!message) return;

    switch (message.type) {
      case 'respec:set-mode':
        mode = message.mode;
        overlay.setPinMode(mode === 'pin');
        break;
      case 'respec:show-pins':
        pins = message.pins;
        selectedPinId = message.selectedPinId;
        scheduleRender();
        scheduleMissingCheck();
        if (pendingScrollPinId && scrollToPin(pendingScrollPinId)) pendingScrollPinId = null;
        break;
      case 'respec:navigate':
        if (message.path !== path) {
          // 사이트 라우터를 모르므로 새로 불러옵니다. 새 문서의 스크립트가 다시 `ready`를 보냅니다.
          const url = new URL(message.path, win.location.href);
          if (url.origin === win.location.origin && isPagePath(message.path)) {
            win.location.assign(url.href);
          }
          break;
        }
        if (message.pinId && !scrollToPin(message.pinId)) pendingScrollPinId = message.pinId;
        break;
    }
  };

  // 사이트 리스너보다 먼저 받도록 window capture 단계에서 처리합니다.
  const handlePointer = (event: Event) => {
    const hit = overlay.hitTest(event);
    if (!hit) return;
    event.stopImmediatePropagation();
    if (event.type !== 'click') return;
    event.preventDefault();

    if (hit.kind === 'marker') {
      post({ type: 'respec:pin-clicked', pinId: hit.pinId });
      return;
    }
    const { clientX, clientY } = event as MouseEvent;
    const element =
      findElementAtPoint(doc, clientX, clientY, { ignore: overlay.host }) ??
      doc.body ??
      doc.documentElement;
    post({
      type: 'respec:pin-created',
      anchor: createAnchor({ element, clientX, clientY, pagePath: path }),
      x: win.innerWidth > 0 ? (clientX / win.innerWidth) * 100 : 50,
      y: win.innerHeight > 0 ? (clientY / win.innerHeight) * 100 : 50,
    });
  };

  const stopWatchingPath = watchPagePath(win, (next) => {
    path = next;
    // 새 경로의 핀은 부모가 다시 보내 줍니다. 그 전까지 이전 경로 마커를 지웁니다.
    pins = [];
    scheduleRender();
    post({ type: 'respec:path-changed', path });
  });

  const observer = new MutationObserver(scheduleRender);
  observer.observe(doc.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    characterData: true,
  });

  win.addEventListener('message', handleMessage);
  win.addEventListener('scroll', scheduleRender, { capture: true, passive: true });
  win.addEventListener('resize', scheduleRender);
  for (const type of BLOCKED_EVENTS) win.addEventListener(type, handlePointer, true);

  post({ type: 'respec:ready', version: PIN_BRIDGE_VERSION, path });

  return () => {
    stopWatchingPath();
    observer.disconnect();
    win.removeEventListener('message', handleMessage);
    win.removeEventListener('scroll', scheduleRender, { capture: true });
    win.removeEventListener('resize', scheduleRender);
    for (const type of BLOCKED_EVENTS) win.removeEventListener(type, handlePointer, true);
    win.clearTimeout(missingTimer);
    if (frame) win.cancelAnimationFrame(frame);
    overlay.destroy();
  };
}
