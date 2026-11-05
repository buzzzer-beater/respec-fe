import type { LocationContext, PinAnchor, RestorableAnchor } from '../pin-engine';

/**
 * 워크스페이스(부모)와 배포 사이트에 넣은 `respec-pin.js`(iframe) 사이의 postMessage 규격입니다.
 * 양쪽이 이 파일 하나를 같이 씁니다. 규격을 바꾸면 `PIN_BRIDGE_VERSION`을 올리고
 * `pnpm build:pin-script`로 `public/respec-pin.js`를 다시 만듭니다.
 */
export const PIN_BRIDGE_VERSION = 4;

/** RE:SPEC이 핀 스크립트를 내려주는 경로 (`public/respec-pin.js`) */
export const PIN_SCRIPT_PATH = '/respec-pin.js';

/** 스크립트 주소와 RE:SPEC 주소가 다를 때(로컬 개발 등) 허용할 origin을 적는 속성. 공백이나 쉼표로 여러 개 */
export const PIN_SCRIPT_ORIGIN_ATTRIBUTE = 'data-respec-origin';

const PREFIX = 'respec:';

export type BridgeMode = 'browse' | 'pin';

/** 마커 색. 앱의 `PinTone`(차례별 색)과 같은 값입니다: 내 차례 · 상대 차례 · 해결됨 */
export const BRIDGE_PIN_TONES = ['brand', 'quiet', 'done'] as const;
export type BridgePinTone = (typeof BRIDGE_PIN_TONES)[number];

/** 백엔드 `location_status`와 같은 값입니다. */
export type BridgePinLocationStatus = 'located' | 'needs_check';

/**
 * 마커 종류. `pin` = 그 사이트에 찍은 핀, `review` = 개발자가 검수 요청 때 배포본에 찍은 반영 위치(흰 테두리),
 * `draft` = 아직 보내지 않은 위치(검정, 누를 수 없음)
 */
export const BRIDGE_PIN_KINDS = ['pin', 'review', 'draft'] as const;
export type BridgePinKind = (typeof BRIDGE_PIN_KINDS)[number];

/**
 * iframe으로 보내는 핀. 위치와 표시에 필요한 값만 담습니다.
 * 배포 사이트는 다른 사람이 만든 문서라서 요청 내용, 작성자, 인증 정보는 보내지 않습니다.
 */
export type BridgePin = RestorableAnchor & {
  id: string;
  number: number;
  page_path: string;
  /** 차례에 따른 색 */
  tone: BridgePinTone;
  /** 내가 움직일 차례. 빨간 점을 붙입니다. */
  alert: boolean;
  kind: BridgePinKind;
  /** 서버에 저장된 위치 상태. 스크립트가 `pin-missing`/`pin-found`를 보낼지 판단할 때 씁니다. */
  location_status: BridgePinLocationStatus;
};

/** 부모 → iframe */
export type ParentMessage =
  | { type: 'respec:set-mode'; mode: BridgeMode }
  | { type: 'respec:show-pins'; pins: BridgePin[]; selectedPinId: string | null }
  /** 채팅 핀 카드 등으로 핀을 고르면 해당 경로로 옮기고 핀으로 스크롤합니다. */
  | { type: 'respec:navigate'; path: string; pinId: string | null };

/** iframe → 부모 */
export type SiteMessage =
  | { type: 'respec:ready'; version: number; path: string }
  | { type: 'respec:path-changed'; path: string }
  /** `x`, `y`는 클릭한 지점의 iframe 화면 기준 위치(%)입니다. 저장 전 입력창을 띄울 때 씁니다. */
  | { type: 'respec:pin-created'; anchor: PinAnchor; x: number; y: number }
  | { type: 'respec:pin-clicked'; pinId: string }
  /** DOM에 요소가 아예 없음 → `needs_check` 보고 대상. 핀 상태가 바뀔 때만 보냅니다. */
  | { type: 'respec:pin-missing'; pinId: string }
  /** 못 찾던 요소를 다시 찾음 → `located` 보고 대상. 핀 상태가 바뀔 때만 보냅니다. */
  | { type: 'respec:pin-found'; pinId: string };

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isRatio = (value: unknown): value is number =>
  isFiniteNumber(value) && value >= 0 && value <= 1;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

/** `/`로 시작하는 같은 사이트 경로. `//host` 같은 다른 출처 주소는 받지 않습니다. */
export const isPagePath = (value: unknown): value is string =>
  typeof value === 'string' && value.startsWith('/') && !value.startsWith('//');

const TEXT_FIELDS = ['element_text', 'section_name'] as const;
const NUMBER_FIELDS = ['index', 'viewport_width', 'page_x', 'page_y'] as const;

/**
 * `location_context`를 알려진 필드만 남겨 새로 만듭니다.
 * 백엔드가 `extra="forbid"`라서 모르는 필드가 섞이면 422가 납니다.
 */
const toLocationContext = (value: unknown): LocationContext | undefined => {
  if (!isRecord(value)) return undefined;
  const context: LocationContext = {};
  for (const key of TEXT_FIELDS) {
    if (isNonEmptyString(value[key])) context[key] = value[key];
  }
  for (const key of NUMBER_FIELDS) {
    if (isFiniteNumber(value[key])) context[key] = value[key];
  }
  return Object.keys(context).length > 0 ? context : undefined;
};

const toAnchor = (value: unknown): PinAnchor | null => {
  if (!isRecord(value)) return null;
  const { page_path, element_selector, relative_x, relative_y } = value;
  if (!isPagePath(page_path) || !isNonEmptyString(element_selector)) return null;
  if (!isRatio(relative_x) || !isRatio(relative_y)) return null;
  const anchor: PinAnchor = { page_path, element_selector, relative_x, relative_y };
  const context = toLocationContext(value.location_context);
  if (context) anchor.location_context = context;
  return anchor;
};

const isTone = (value: unknown): value is BridgePinTone =>
  BRIDGE_PIN_TONES.includes(value as BridgePinTone);

const isKind = (value: unknown): value is BridgePinKind =>
  BRIDGE_PIN_KINDS.includes(value as BridgePinKind);

const toBridgePin = (value: unknown): BridgePin | null => {
  if (!isRecord(value)) return null;
  const { id, number, page_path, element_selector, relative_x, relative_y, tone, alert, kind } =
    value;
  if (!isNonEmptyString(id) || !isFiniteNumber(number) || !isPagePath(page_path)) return null;
  if (!isNonEmptyString(element_selector)) return null;
  if (!isFiniteNumber(relative_x) || !isFiniteNumber(relative_y)) return null;
  return {
    id,
    number,
    page_path,
    element_selector,
    relative_x,
    relative_y,
    location_context: toLocationContext(value.location_context) ?? null,
    tone: isTone(tone) ? tone : 'brand',
    alert: alert === true,
    kind: isKind(kind) ? kind : 'pin',
    location_status: value.location_status === 'needs_check' ? 'needs_check' : 'located',
  };
};

/** 부모가 보낸 메시지를 확인합니다. 모양이 맞지 않으면 `null`입니다. */
export const parseParentMessage = (data: unknown): ParentMessage | null => {
  if (!isRecord(data) || typeof data.type !== 'string' || !data.type.startsWith(PREFIX)) {
    return null;
  }
  switch (data.type) {
    case 'respec:set-mode':
      return data.mode === 'browse' || data.mode === 'pin'
        ? { type: data.type, mode: data.mode }
        : null;
    case 'respec:show-pins': {
      if (!Array.isArray(data.pins)) return null;
      const pins = data.pins.flatMap((pin) => toBridgePin(pin) ?? []);
      const selectedPinId = isNonEmptyString(data.selectedPinId) ? data.selectedPinId : null;
      return { type: data.type, pins, selectedPinId };
    }
    case 'respec:navigate':
      if (!isPagePath(data.path)) return null;
      return {
        type: data.type,
        path: data.path,
        pinId: isNonEmptyString(data.pinId) ? data.pinId : null,
      };
    default:
      return null;
  }
};

/** iframe이 보낸 메시지를 확인합니다. 모양이 맞지 않으면 `null`입니다. */
export const parseSiteMessage = (data: unknown): SiteMessage | null => {
  if (!isRecord(data) || typeof data.type !== 'string' || !data.type.startsWith(PREFIX)) {
    return null;
  }
  switch (data.type) {
    case 'respec:ready':
      return isFiniteNumber(data.version) && isPagePath(data.path)
        ? { type: data.type, version: data.version, path: data.path }
        : null;
    case 'respec:path-changed':
      return isPagePath(data.path) ? { type: data.type, path: data.path } : null;
    case 'respec:pin-created': {
      const anchor = toAnchor(data.anchor);
      if (!anchor || !isFiniteNumber(data.x) || !isFiniteNumber(data.y)) return null;
      return { type: data.type, anchor, x: data.x, y: data.y };
    }
    case 'respec:pin-clicked':
    case 'respec:pin-missing':
    case 'respec:pin-found':
      return isNonEmptyString(data.pinId) ? { type: data.type, pinId: data.pinId } : null;
    default:
      return null;
  }
};

/** URL의 origin. 잘못된 주소면 `null`입니다. */
export const toOrigin = (url: string | null | undefined): string | null => {
  if (!url) return null;
  try {
    const { origin } = new URL(url);
    return origin === 'null' ? null : origin;
  } catch {
    return null;
  }
};
