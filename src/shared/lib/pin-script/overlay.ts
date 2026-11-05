import type { BridgePinTone } from '../pin-bridge';
import { PIN_COLORS, PIN_EASING, PIN_TONE_COLORS } from './theme';

/** 사이트 CSS의 `div { ... }` 같은 규칙이 걸리지 않도록 사용자 정의 태그를 씁니다. */
export const OVERLAY_TAG = 'respec-pin-root';

const MARKER_ATTRIBUTE = 'data-pin-id';

const FONT = `'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif`;

const TONE_STYLE = (Object.keys(PIN_TONE_COLORS) as BridgePinTone[])
  .map((tone) => {
    const { fill, hover } = PIN_TONE_COLORS[tone];
    const hoverRule = hover ? `background: ${hover};` : 'filter: brightness(0.9);';
    return `.marker[data-tone='${tone}'] .pin { background: ${fill}; }
.marker[data-tone='${tone}']:hover .pin { ${hoverRule} }`;
  })
  .join('\n');

// 앱의 `PinMarkerButton` + `NumberedPin`과 같은 모양입니다. 왼쪽 아래 뾰족한 모서리가 핀이 가리키는 지점입니다.
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
  font: 800 13px/1 ${FONT}; color: #fff; text-align: left;
}
.marker[data-selected] { z-index: 2; }
.marker:hover, .marker:focus-visible { z-index: 3; }
.marker:focus-visible { outline: 2px solid ${PIN_COLORS.ink}; outline-offset: 2px; }
.pin {
  box-sizing: border-box; display: grid; place-items: center; width: 30px; height: 30px;
  border-radius: 50% 50% 50% 6px; font-size: 13px;
  transition-property: width, height, scale, background-color;
  transition-duration: 300ms; transition-timing-function: ${PIN_EASING.spring};
  animation: pin-drop 0.45s ${PIN_EASING['out-soft']} both;
}
${TONE_STYLE}
.marker:hover .pin { scale: 1.1; }
.marker[data-muted] .pin { width: 12px; height: 12px; font-size: 0; }
.marker[data-muted]:hover .pin { width: 28px; height: 28px; font-size: 12px; scale: 1; }
.marker[data-selected] .pin {
  scale: 1.1; box-shadow: 0 0 0 4px color-mix(in oklab, ${PIN_COLORS.brand} 30%, transparent);
}
.marker[data-needs-check] .pin { border: 2px dashed currentColor; opacity: 0.6; }
.tip {
  position: absolute; top: 0; left: 100%; margin-left: 8px; box-sizing: border-box;
  width: max-content; max-width: 240px; padding: 8px 12px; border-radius: 10px;
  background: ${PIN_COLORS.ink}; color: #fff; font: 600 13px/1.375 ${FONT};
  overflow-wrap: anywhere; word-break: keep-all; white-space: normal;
  display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; overflow: hidden;
  pointer-events: none; visibility: hidden; opacity: 0; transition: opacity 150ms;
}
.tip:empty { display: none; }
.marker:hover .tip, .marker:focus-visible .tip { visibility: visible; opacity: 1; }
@keyframes pin-drop { from { opacity: 0; translate: 0 -20px; } }
`;

export type OverlayMarker = {
  pinId: string;
  number: number;
  /** viewport 기준 좌표 */
  clientX: number;
  clientY: number;
  tone: BridgePinTone;
  muted: boolean;
  selected: boolean;
  /** 요소를 다시 찾지 못해 저장된 좌표에 그리는 핀. 흐린 점선으로 그립니다. */
  needsCheck: boolean;
  /** 마우스를 올리면 보여 줄 요청 내용 */
  preview: string | null;
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
    const tip = doc.createElement('span');
    tip.className = 'tip';
    tip.setAttribute('aria-hidden', 'true');
    button.append(pin, tip);
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
      const [pin, tip] = button.children;
      pin.textContent = String(item.number);
      // 사이트 문서에 넣는 값이라 `textContent`로만 씁니다.
      tip.textContent = item.preview ?? '';
      button.setAttribute(
        'aria-label',
        [`${item.number}번 핀`, item.needsCheck && '위치 확인 필요', item.preview]
          .filter(Boolean)
          .join(', '),
      );
      button.setAttribute('aria-pressed', String(item.selected));
      button.setAttribute('data-tone', item.tone);
      button.toggleAttribute('data-muted', item.muted && !item.selected);
      button.toggleAttribute('data-selected', item.selected);
      button.toggleAttribute('data-needs-check', item.needsCheck);
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
