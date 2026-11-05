import type { BridgePinKind, BridgePinTone } from '../pin-bridge';
import { PIN_COLORS, PIN_EASING, PIN_TONE_COLORS } from './theme';

/** 사이트 CSS의 `div { ... }` 같은 규칙이 걸리지 않도록 사용자 정의 태그를 씁니다. */
export const OVERLAY_TAG = 'respec-pin-root';

const MARKER_ATTRIBUTE = 'data-pin-id';

const FONT = `'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif`;

const TONE_STYLE = (Object.keys(PIN_TONE_COLORS) as BridgePinTone[])
  .map((tone) => `.marker[data-tone='${tone}'] .pin { background: ${PIN_TONE_COLORS[tone]}; }`)
  .join('\n');

// 앱의 `PinMarkerButton` + `NumberedPin`과 같은 모양입니다. 왼쪽 아래 뾰족한 모서리가 핀이 가리키는 지점입니다.
// 위치는 스크롤할 때마다 다시 계산하므로 `left`/`top`에 transition을 두지 않습니다(두면 스크롤을 늦게 따라옵니다).
const STYLE = `
:host { all: initial; }
.layer {
  position: fixed; inset: 0; display: none;
  pointer-events: auto; cursor: crosshair; background: transparent;
}
.layer[data-active] { display: block; }
.marker {
  all: initial; position: fixed; display: block; box-sizing: border-box; z-index: 1;
  pointer-events: auto; cursor: pointer; transform: translateY(-100%);
  font: 800 15px/1 ${FONT}; color: #fff; text-align: left;
}
.marker[data-selected] { z-index: 2; }
.marker:hover, .marker:focus-visible { z-index: 3; }
.marker:focus-visible { outline: 2px solid ${PIN_COLORS.ink}; outline-offset: 2px; }
.pin {
  position: relative; box-sizing: border-box; display: grid; place-items: center;
  width: 38px; height: 38px; border-radius: 50% 50% 50% 8px; font-size: 15px;
  transform-origin: bottom left; transition-property: scale, background-color;
  transition-duration: 300ms; transition-timing-function: ${PIN_EASING.spring};
  animation: pin-drop 0.45s ${PIN_EASING['out-soft']} both;
}
${TONE_STYLE}
.marker:hover .pin { scale: 1.2; }
.marker[data-selected] .pin { scale: 1.2; background: ${PIN_COLORS['brand-strong']}; }
.marker[data-alert]:not([data-selected]) .pin::after {
  content: ''; position: absolute; top: 1px; right: 1px; box-sizing: border-box;
  width: 10px; height: 10px; border: 2px solid #fff; border-radius: 50%;
  background: ${PIN_COLORS.alert};
}
.marker[data-kind='review'] .pin { box-shadow: 0 0 0 2px #fff, 0 0 0 3.5px ${PIN_COLORS.ink}; }
.marker[data-kind='draft'] { pointer-events: none; cursor: default; }
.marker[data-kind='draft'] .pin { background: ${PIN_COLORS.ink}; }
@keyframes pin-drop { from { opacity: 0; translate: 0 -20px; } }
`;

export type OverlayMarker = {
  pinId: string;
  number: number;
  /** viewport 기준 좌표 */
  clientX: number;
  clientY: number;
  tone: BridgePinTone;
  /** 내가 움직일 차례. 빨간 점을 붙입니다(고른 핀 제외). */
  alert: boolean;
  selected: boolean;
  kind: BridgePinKind;
};

export type Overlay = {
  host: HTMLElement;
  setPinMode: (active: boolean) => void;
  render: (markers: readonly OverlayMarker[]) => void;
  /** 이벤트 경로에 투명 레이어나 마커가 있는지 */
  hitTest: (event: Event) => { kind: 'marker'; pinId: string } | { kind: 'layer' } | null;
  destroy: () => void;
};

/**
 * 핀 마커와 핀 모드용 투명 레이어를 Shadow DOM 안에 그립니다.
 * host는 화면 전체를 덮는 `position: fixed` 요소이고, 자신은 클릭을 받지 않습니다(`pointer-events: none`).
 */
export function createOverlay(doc: Document): Overlay {
  const host = doc.createElement(OVERLAY_TAG);
  host.setAttribute(
    'style',
    'all: initial !important; position: fixed !important; inset: 0 !important; z-index: 2147483647 !important; pointer-events: none !important; display: block !important;',
  );
  const root = host.attachShadow({ mode: 'open' });

  const style = doc.createElement('style');
  style.textContent = STYLE;
  const layer = doc.createElement('div');
  layer.className = 'layer';
  const markers = doc.createElement('div');
  root.append(style, layer, markers);
  doc.documentElement.append(host);

  const buttons = new Map<string, HTMLButtonElement>();

  const createMarker = (pinId: string) => {
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = 'marker';
    button.setAttribute(MARKER_ATTRIBUTE, pinId);
    const pin = doc.createElement('span');
    pin.className = 'pin';
    button.append(pin);
    return button;
  };

  const render = (items: readonly OverlayMarker[]) => {
    const seen = new Set<string>();
    for (const item of items) {
      seen.add(item.pinId);
      let button = buttons.get(item.pinId);
      if (!button) {
        button = createMarker(item.pinId);
        buttons.set(item.pinId, button);
        markers.append(button);
      }
      const isDraft = item.kind === 'draft';
      button.children[0].textContent = String(item.number);
      button.setAttribute('aria-label', `핀 ${item.number}`);
      if (item.kind === 'review') button.title = `핀 ${item.number} 반영 위치`;
      else button.removeAttribute('title');
      // 아직 보내지 않은 위치는 누를 수 없어서 키보드 순서와 화면 읽기에서도 뺍니다.
      button.tabIndex = isDraft ? -1 : 0;
      if (isDraft) button.setAttribute('aria-hidden', 'true');
      else button.removeAttribute('aria-hidden');
      button.setAttribute('aria-pressed', String(item.selected));
      button.setAttribute('data-tone', item.tone);
      button.setAttribute('data-kind', item.kind);
      button.toggleAttribute('data-alert', item.alert && !isDraft);
      button.toggleAttribute('data-selected', item.selected && !isDraft);
      button.style.left = `${item.clientX}px`;
      button.style.top = `${item.clientY}px`;
    }
    for (const [pinId, button] of buttons) {
      if (seen.has(pinId)) continue;
      button.remove();
      buttons.delete(pinId);
    }
  };

  const hitTest: Overlay['hitTest'] = (event) => {
    for (const target of event.composedPath()) {
      if (target === layer) return { kind: 'layer' };
      if (target === host) return null;
      const pinId = (target as Element).getAttribute?.(MARKER_ATTRIBUTE);
      if (pinId) return { kind: 'marker', pinId };
    }
    return null;
  };

  return {
    host,
    setPinMode: (active) => layer.toggleAttribute('data-active', active),
    render,
    hitTest,
    destroy: () => host.remove(),
  };
}
