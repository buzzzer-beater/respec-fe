/** 사이트 CSS의 `div { ... }` 같은 규칙이 걸리지 않도록 사용자 정의 태그를 씁니다. */
export const OVERLAY_TAG = 'respec-pin-root';

const MARKER_ATTRIBUTE = 'data-pin-id';

// 워크스페이스의 `NumberedPin`과 같은 모양입니다. 왼쪽 아래 뾰족한 모서리가 핀이 가리키는 지점입니다.
const STYLE = `
:host { all: initial; }
.layer {
  position: fixed; inset: 0; display: none;
  pointer-events: auto; cursor: crosshair; background: transparent;
}
.layer[data-active] { display: block; }
.marker {
  all: initial; position: fixed; box-sizing: border-box; pointer-events: auto; cursor: pointer;
  display: grid; place-items: center; width: 30px; height: 30px;
  transform: translateY(-100%); border-radius: 50% 50% 50% 6px;
  background: #5647e0; color: #fff;
  font: 800 13px/1 system-ui, -apple-system, 'Segoe UI', sans-serif;
}
.marker:hover { background: #3f31c9; z-index: 1; }
.marker[data-muted] { width: 12px; height: 12px; font-size: 0; }
.marker[data-muted]:hover { width: 28px; height: 28px; font-size: 12px; }
.marker[data-selected] { box-shadow: 0 0 0 4px rgba(86, 71, 224, 0.3); z-index: 2; }
`;

export type OverlayMarker = {
  pinId: string;
  number: number;
  /** viewport 기준 좌표 */
  clientX: number;
  clientY: number;
  muted: boolean;
  selected: boolean;
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

  const render = (items: readonly OverlayMarker[]) => {
    const seen = new Set<string>();
    for (const item of items) {
      seen.add(item.pinId);
      let button = buttons.get(item.pinId);
      if (!button) {
        button = doc.createElement('button');
        button.type = 'button';
        button.className = 'marker';
        button.setAttribute(MARKER_ATTRIBUTE, item.pinId);
        buttons.set(item.pinId, button);
        markers.append(button);
      }
      button.textContent = String(item.number);
      button.setAttribute('aria-label', `${item.number}번 핀`);
      button.toggleAttribute('data-muted', item.muted && !item.selected);
      button.toggleAttribute('data-selected', item.selected);
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
