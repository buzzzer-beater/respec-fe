/*! respec-pin.js - RE:SPEC 핀 스크립트. scripts/build-pin-script.mjs로 만든 파일이라 직접 고치지 마세요. */
(function () {
  'use strict';
  var modules = [
// src/shared/lib/pin-script/entry.ts
function (module, exports, __require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const runtime_1 = __require(1);
const script_origin_1 = __require(13);
function main(win) {
    if (win.parent === win || win.__respecPin)
        return;
    const allowedOrigins = (0, script_origin_1.getAllowedOrigins)((0, script_origin_1.findPinScript)(win.document));
    if (allowedOrigins.length === 0)
        return;
    win.__respecPin = true;
    const start = () => (0, runtime_1.startPinScript)({ win, parent: win.parent, allowedOrigins });
    if (win.document.documentElement)
        start();
    else
        win.addEventListener('DOMContentLoaded', start, { once: true });
}
main(window);
},
// src/shared/lib/pin-script/runtime.ts
function (module, exports, __require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOCATION_CHECK_DELAY_MS = void 0;
exports.startPinScript = startPinScript;
const pin_bridge_1 = __require(2);
const pin_engine_1 = __require(4);
const history_1 = __require(10);
const overlay_1 = __require(11);
exports.LOCATION_CHECK_DELAY_MS = 2000;
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
];
function startPinScript({ win, parent, allowedOrigins }) {
    const doc = win.document;
    const overlay = (0, overlay_1.createOverlay)(doc);
    let mode = 'browse';
    let path = (0, history_1.getPagePath)(win);
    let pins = [];
    let selectedPinId = null;
    let pendingScrollPinId = null;
    const locationStates = new Map();
    let frame = 0;
    let checkTimer;
    const post = (message) => {
        for (const origin of allowedOrigins)
            parent.postMessage(message, origin);
    };
    const currentPins = () => pins.filter((pin) => pin.page_path === path);
    const getLocationState = (pin) => { var _a; return (_a = locationStates.get(pin.id)) !== null && _a !== void 0 ? _a : (pin.location_status === 'needs_check' ? 'missing' : 'found'); };
    const render = () => {
        frame = 0;
        const markers = [];
        for (const pin of currentPins()) {
            const result = (0, pin_engine_1.restoreAnchor)(doc, pin);
            if (result.status !== 'found')
                continue;
            markers.push({
                pinId: pin.id,
                number: pin.number,
                clientX: result.position.clientX,
                clientY: result.position.clientY,
                tone: pin.tone,
                alert: pin.alert,
                selected: pin.id === selectedPinId,
                kind: pin.kind,
            });
        }
        overlay.render(markers);
    };
    const scheduleRender = () => {
        if (!frame)
            frame = win.requestAnimationFrame(render);
    };
    const checkLocations = () => {
        checkTimer = undefined;
        for (const pin of currentPins()) {
            if (pin.kind !== 'pin')
                continue;
            const { status } = (0, pin_engine_1.restoreAnchor)(doc, pin);
            if (status === 'hidden' || status === getLocationState(pin))
                continue;
            locationStates.set(pin.id, status);
            post({
                type: status === 'missing' ? 'respec:pin-missing' : 'respec:pin-found',
                pinId: pin.id,
            });
        }
    };
    const scheduleLocationCheck = (restart) => {
        if (checkTimer !== undefined && !restart)
            return;
        win.clearTimeout(checkTimer);
        checkTimer = win.setTimeout(checkLocations, exports.LOCATION_CHECK_DELAY_MS);
    };
    const handleMutation = () => {
        scheduleRender();
        if (pins.length > 0)
            scheduleLocationCheck(false);
    };
    const scrollToPin = (pinId) => {
        const pin = currentPins().find((item) => item.id === pinId);
        if (!pin)
            return false;
        const result = (0, pin_engine_1.restoreAnchor)(doc, pin);
        if (result.status !== 'found')
            return true;
        const { clientY } = result.position;
        if (clientY < 0 || clientY > win.innerHeight) {
            result.element.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
        return true;
    };
    const handleMessage = (event) => {
        if (event.source !== parent || !allowedOrigins.includes(event.origin))
            return;
        const message = (0, pin_bridge_1.parseParentMessage)(event.data);
        if (!message)
            return;
        switch (message.type) {
            case 'respec:set-mode':
                mode = message.mode;
                overlay.setPinMode(mode === 'pin');
                break;
            case 'respec:show-pins':
                pins = message.pins;
                selectedPinId = message.selectedPinId;
                scheduleRender();
                scheduleLocationCheck(true);
                if (pendingScrollPinId && scrollToPin(pendingScrollPinId))
                    pendingScrollPinId = null;
                break;
            case 'respec:navigate':
                if (message.path !== path) {
                    const url = new URL(message.path, win.location.href);
                    if (url.origin === win.location.origin && (0, pin_bridge_1.isPagePath)(message.path)) {
                        win.location.assign(url.href);
                    }
                    break;
                }
                if (message.pinId && !scrollToPin(message.pinId))
                    pendingScrollPinId = message.pinId;
                break;
        }
    };
    const handlePointer = (event) => {
        var _a, _b;
        const hit = overlay.hitTest(event);
        if (!hit)
            return;
        event.stopImmediatePropagation();
        if (event.type !== 'click')
            return;
        event.preventDefault();
        if (hit.kind === 'marker') {
            post({ type: 'respec:pin-clicked', pinId: hit.pinId });
            return;
        }
        const { clientX, clientY } = event;
        const element = (_b = (_a = (0, pin_engine_1.findElementAtPoint)(doc, clientX, clientY, { ignore: overlay.host })) !== null && _a !== void 0 ? _a : doc.body) !== null && _b !== void 0 ? _b : doc.documentElement;
        post({
            type: 'respec:pin-created',
            anchor: (0, pin_engine_1.createAnchor)({ element, clientX, clientY, pagePath: path }),
            x: win.innerWidth > 0 ? (clientX / win.innerWidth) * 100 : 50,
            y: win.innerHeight > 0 ? (clientY / win.innerHeight) * 100 : 50,
        });
    };
    const stopWatchingPath = (0, history_1.watchPagePath)(win, (next) => {
        path = next;
        pins = [];
        scheduleRender();
        post({ type: 'respec:path-changed', path });
    });
    const observer = new MutationObserver(handleMutation);
    observer.observe(doc.documentElement, {
        subtree: true,
        childList: true,
        attributes: true,
        characterData: true,
    });
    win.addEventListener('message', handleMessage);
    win.addEventListener('scroll', scheduleRender, { capture: true, passive: true });
    win.addEventListener('resize', scheduleRender);
    for (const type of BLOCKED_EVENTS)
        win.addEventListener(type, handlePointer, true);
    post({ type: 'respec:ready', version: pin_bridge_1.PIN_BRIDGE_VERSION, path });
    return () => {
        stopWatchingPath();
        observer.disconnect();
        win.removeEventListener('message', handleMessage);
        win.removeEventListener('scroll', scheduleRender, { capture: true });
        win.removeEventListener('resize', scheduleRender);
        for (const type of BLOCKED_EVENTS)
            win.removeEventListener(type, handlePointer, true);
        win.clearTimeout(checkTimer);
        if (frame)
            win.cancelAnimationFrame(frame);
        overlay.destroy();
    };
}
},
// src/shared/lib/pin-bridge/index.ts
function (module, exports, __require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toOrigin = exports.PIN_SCRIPT_PATH = exports.PIN_SCRIPT_ORIGIN_ATTRIBUTE = exports.PIN_BRIDGE_VERSION = exports.parseSiteMessage = exports.parseParentMessage = exports.isPagePath = exports.BRIDGE_PIN_TONES = exports.BRIDGE_PIN_KINDS = void 0;
var protocol_1 = __require(3);
Object.defineProperty(exports, "BRIDGE_PIN_KINDS", { enumerable: true, get: function () { return protocol_1.BRIDGE_PIN_KINDS; } });
Object.defineProperty(exports, "BRIDGE_PIN_TONES", { enumerable: true, get: function () { return protocol_1.BRIDGE_PIN_TONES; } });
Object.defineProperty(exports, "isPagePath", { enumerable: true, get: function () { return protocol_1.isPagePath; } });
Object.defineProperty(exports, "parseParentMessage", { enumerable: true, get: function () { return protocol_1.parseParentMessage; } });
Object.defineProperty(exports, "parseSiteMessage", { enumerable: true, get: function () { return protocol_1.parseSiteMessage; } });
Object.defineProperty(exports, "PIN_BRIDGE_VERSION", { enumerable: true, get: function () { return protocol_1.PIN_BRIDGE_VERSION; } });
Object.defineProperty(exports, "PIN_SCRIPT_ORIGIN_ATTRIBUTE", { enumerable: true, get: function () { return protocol_1.PIN_SCRIPT_ORIGIN_ATTRIBUTE; } });
Object.defineProperty(exports, "PIN_SCRIPT_PATH", { enumerable: true, get: function () { return protocol_1.PIN_SCRIPT_PATH; } });
Object.defineProperty(exports, "toOrigin", { enumerable: true, get: function () { return protocol_1.toOrigin; } });
},
// src/shared/lib/pin-bridge/protocol.ts
function (module, exports, __require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toOrigin = exports.parseSiteMessage = exports.parseParentMessage = exports.isPagePath = exports.BRIDGE_PIN_KINDS = exports.BRIDGE_PIN_TONES = exports.PIN_SCRIPT_ORIGIN_ATTRIBUTE = exports.PIN_SCRIPT_PATH = exports.PIN_BRIDGE_VERSION = void 0;
exports.PIN_BRIDGE_VERSION = 4;
exports.PIN_SCRIPT_PATH = '/respec-pin.js';
exports.PIN_SCRIPT_ORIGIN_ATTRIBUTE = 'data-respec-origin';
const PREFIX = 'respec:';
exports.BRIDGE_PIN_TONES = ['brand', 'quiet', 'done'];
exports.BRIDGE_PIN_KINDS = ['pin', 'review', 'draft'];
const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value);
const isRatio = (value) => isFiniteNumber(value) && value >= 0 && value <= 1;
const isNonEmptyString = (value) => typeof value === 'string' && value.length > 0;
const isPagePath = (value) => typeof value === 'string' && value.startsWith('/') && !value.startsWith('//');
exports.isPagePath = isPagePath;
const TEXT_FIELDS = ['element_text', 'section_name'];
const NUMBER_FIELDS = ['index', 'viewport_width', 'page_x', 'page_y'];
const toLocationContext = (value) => {
    if (!isRecord(value))
        return undefined;
    const context = {};
    for (const key of TEXT_FIELDS) {
        if (isNonEmptyString(value[key]))
            context[key] = value[key];
    }
    for (const key of NUMBER_FIELDS) {
        if (isFiniteNumber(value[key]))
            context[key] = value[key];
    }
    return Object.keys(context).length > 0 ? context : undefined;
};
const toAnchor = (value) => {
    if (!isRecord(value))
        return null;
    const { page_path, element_selector, relative_x, relative_y } = value;
    if (!(0, exports.isPagePath)(page_path) || !isNonEmptyString(element_selector))
        return null;
    if (!isRatio(relative_x) || !isRatio(relative_y))
        return null;
    const anchor = { page_path, element_selector, relative_x, relative_y };
    const context = toLocationContext(value.location_context);
    if (context)
        anchor.location_context = context;
    return anchor;
};
const isTone = (value) => exports.BRIDGE_PIN_TONES.includes(value);
const isKind = (value) => exports.BRIDGE_PIN_KINDS.includes(value);
const toBridgePin = (value) => {
    var _a;
    if (!isRecord(value))
        return null;
    const { id, number, page_path, element_selector, relative_x, relative_y, tone, alert, kind } = value;
    if (!isNonEmptyString(id) || !isFiniteNumber(number) || !(0, exports.isPagePath)(page_path))
        return null;
    if (!isNonEmptyString(element_selector))
        return null;
    if (!isFiniteNumber(relative_x) || !isFiniteNumber(relative_y))
        return null;
    return {
        id,
        number,
        page_path,
        element_selector,
        relative_x,
        relative_y,
        location_context: (_a = toLocationContext(value.location_context)) !== null && _a !== void 0 ? _a : null,
        tone: isTone(tone) ? tone : 'brand',
        alert: alert === true,
        kind: isKind(kind) ? kind : 'pin',
        location_status: value.location_status === 'needs_check' ? 'needs_check' : 'located',
    };
};
const parseParentMessage = (data) => {
    if (!isRecord(data) || typeof data.type !== 'string' || !data.type.startsWith(PREFIX)) {
        return null;
    }
    switch (data.type) {
        case 'respec:set-mode':
            return data.mode === 'browse' || data.mode === 'pin'
                ? { type: data.type, mode: data.mode }
                : null;
        case 'respec:show-pins': {
            if (!Array.isArray(data.pins))
                return null;
            const pins = data.pins.flatMap((pin) => { var _a; return (_a = toBridgePin(pin)) !== null && _a !== void 0 ? _a : []; });
            const selectedPinId = isNonEmptyString(data.selectedPinId) ? data.selectedPinId : null;
            return { type: data.type, pins, selectedPinId };
        }
        case 'respec:navigate':
            if (!(0, exports.isPagePath)(data.path))
                return null;
            return {
                type: data.type,
                path: data.path,
                pinId: isNonEmptyString(data.pinId) ? data.pinId : null,
            };
        default:
            return null;
    }
};
exports.parseParentMessage = parseParentMessage;
const parseSiteMessage = (data) => {
    if (!isRecord(data) || typeof data.type !== 'string' || !data.type.startsWith(PREFIX)) {
        return null;
    }
    switch (data.type) {
        case 'respec:ready':
            return isFiniteNumber(data.version) && (0, exports.isPagePath)(data.path)
                ? { type: data.type, version: data.version, path: data.path }
                : null;
        case 'respec:path-changed':
            return (0, exports.isPagePath)(data.path) ? { type: data.type, path: data.path } : null;
        case 'respec:pin-created': {
            const anchor = toAnchor(data.anchor);
            if (!anchor || !isFiniteNumber(data.x) || !isFiniteNumber(data.y))
                return null;
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
exports.parseSiteMessage = parseSiteMessage;
const toOrigin = (url) => {
    if (!url)
        return null;
    try {
        const { origin } = new URL(url);
        return origin === 'null' ? null : origin;
    }
    catch (_a) {
        return null;
    }
};
exports.toOrigin = toOrigin;
},
// src/shared/lib/pin-engine/index.ts
function (module, exports, __require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getElementText = exports.isGeneratedId = exports.buildSelector = exports.restoreAnchor = exports.findElementAtPoint = exports.createAnchor = exports.captureAnchor = void 0;
var capture_1 = __require(5);
Object.defineProperty(exports, "captureAnchor", { enumerable: true, get: function () { return capture_1.captureAnchor; } });
Object.defineProperty(exports, "createAnchor", { enumerable: true, get: function () { return capture_1.createAnchor; } });
Object.defineProperty(exports, "findElementAtPoint", { enumerable: true, get: function () { return capture_1.findElementAtPoint; } });
var restore_1 = __require(9);
Object.defineProperty(exports, "restoreAnchor", { enumerable: true, get: function () { return restore_1.restoreAnchor; } });
var selector_1 = __require(7);
Object.defineProperty(exports, "buildSelector", { enumerable: true, get: function () { return selector_1.buildSelector; } });
Object.defineProperty(exports, "isGeneratedId", { enumerable: true, get: function () { return selector_1.isGeneratedId; } });
var text_1 = __require(8);
Object.defineProperty(exports, "getElementText", { enumerable: true, get: function () { return text_1.getElementText; } });
},
// src/shared/lib/pin-engine/capture.ts
function (module, exports, __require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findElementAtPoint = findElementAtPoint;
exports.createAnchor = createAnchor;
exports.captureAnchor = captureAnchor;
const number_1 = __require(6);
const selector_1 = __require(7);
const text_1 = __require(8);
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
function toArray(ignore) {
    return ignore ? [].concat(ignore) : [];
}
function toAnchorElement(element) {
    var _a;
    if (element.namespaceURI !== SVG_NAMESPACE || element.localName === 'svg')
        return element;
    return (_a = element.closest('svg')) !== null && _a !== void 0 ? _a : element;
}
function findElementAtPoint(doc, clientX, clientY, options = {}) {
    const ignored = toArray(options.ignore);
    for (const hit of doc.elementsFromPoint(clientX, clientY)) {
        if (ignored.some((node) => node.contains(hit)))
            continue;
        return toAnchorElement(hit);
    }
    return null;
}
function toRelative(offset, size) {
    if (size <= 0)
        return 0.5;
    return (0, number_1.round)((0, number_1.clamp01)(offset / size), 4);
}
function getSectionName(element) {
    const section = element.closest('section');
    if (!section)
        return undefined;
    if (section.id && !(0, selector_1.isGeneratedId)(section.id))
        return (0, text_1.normalizeText)(section.id);
    const heading = section.querySelector('h1, h2, h3');
    return (heading && (0, text_1.getElementText)(heading)) || undefined;
}
function buildLocationContext(element, selector, clientX, clientY) {
    const doc = element.ownerDocument;
    const view = doc.defaultView;
    const context = {};
    const text = (0, text_1.getElementText)(element);
    if (text)
        context.element_text = text;
    const sectionName = getSectionName(element);
    if (sectionName)
        context.section_name = sectionName;
    const index = Array.from(doc.querySelectorAll(selector)).indexOf(element);
    if (index >= 0)
        context.index = index;
    if (view) {
        const viewportWidth = Math.round(view.innerWidth);
        if (viewportWidth > 0)
            context.viewport_width = viewportWidth;
        context.page_x = Math.round(clientX + view.scrollX);
        context.page_y = Math.round(clientY + view.scrollY);
    }
    return context;
}
function createAnchor({ element, clientX, clientY, pagePath, }) {
    const selector = (0, selector_1.buildSelector)(element);
    const rect = element.getBoundingClientRect();
    return {
        page_path: pagePath,
        element_selector: selector,
        relative_x: toRelative(clientX - rect.left, rect.width),
        relative_y: toRelative(clientY - rect.top, rect.height),
        location_context: buildLocationContext(element, selector, clientX, clientY),
    };
}
function captureAnchor(doc, { clientX, clientY, pagePath, ignore }) {
    const element = findElementAtPoint(doc, clientX, clientY, { ignore });
    if (!element)
        return null;
    return createAnchor({ element, clientX, clientY, pagePath });
}
},
// src/shared/lib/pin-engine/number.ts
function (module, exports, __require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clamp01 = clamp01;
exports.round = round;
function clamp01(value) {
    if (!Number.isFinite(value))
        return 0.5;
    return Math.min(1, Math.max(0, value));
}
function round(value, digits) {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
}
},
// src/shared/lib/pin-engine/selector.ts
function (module, exports, __require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isGeneratedId = isGeneratedId;
exports.cssEscape = cssEscape;
exports.getStableId = getStableId;
exports.buildSelector = buildSelector;
exports.queryAll = queryAll;
const GENERATED_ID_PATTERNS = [
    /^:.*:$/,
    /^«.*»$/,
    /^_.*r_[0-9a-z]+_$/i,
    /:r[0-9a-z]*:/i,
    /«r[0-9a-z]*»/i,
    /_r_[0-9a-z]+_/i,
];
function isGeneratedId(id) {
    return GENERATED_ID_PATTERNS.some((pattern) => pattern.test(id));
}
function cssEscape(doc, value) {
    var _a, _b;
    const css = (_b = (_a = doc.defaultView) === null || _a === void 0 ? void 0 : _a.CSS) !== null && _b !== void 0 ? _b : globalThis.CSS;
    return css.escape(value);
}
function countMatches(doc, selector) {
    return doc.querySelectorAll(selector).length;
}
function getStableId(element) {
    const { id } = element;
    if (!id || /\s/.test(id) || isGeneratedId(id))
        return null;
    const doc = element.ownerDocument;
    return countMatches(doc, `#${cssEscape(doc, id)}`) === 1 ? id : null;
}
function getSegment(element) {
    const doc = element.ownerDocument;
    const tag = cssEscape(doc, element.localName);
    const parent = element.parentElement;
    if (!parent)
        return tag;
    let position = 0;
    let sameTagCount = 0;
    for (const sibling of Array.from(parent.children)) {
        if (sibling.localName !== element.localName)
            continue;
        sameTagCount += 1;
        if (sibling === element)
            position = sameTagCount;
    }
    return sameTagCount > 1 ? `${tag}:nth-of-type(${position})` : tag;
}
function buildSelector(element) {
    const doc = element.ownerDocument;
    const segments = [];
    for (let current = element; current; current = current.parentElement) {
        const id = getStableId(current);
        if (id) {
            segments.unshift(`#${cssEscape(doc, id)}`);
            break;
        }
        segments.unshift(getSegment(current));
        if (countMatches(doc, segments.join(' > ')) === 1)
            break;
    }
    return segments.join(' > ');
}
function queryAll(doc, selector) {
    try {
        return Array.from(doc.querySelectorAll(selector));
    }
    catch (_a) {
        return null;
    }
}
},
// src/shared/lib/pin-engine/text.ts
function (module, exports, __require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_TEXT_LENGTH = void 0;
exports.normalizeText = normalizeText;
exports.getElementText = getElementText;
exports.MAX_TEXT_LENGTH = 100;
const MAX_RAW_LENGTH = exports.MAX_TEXT_LENGTH * 20;
const SHOW_TEXT = 0x4;
const NON_VISIBLE_TEXT_PARENTS = new Set(['script', 'style', 'noscript', 'template']);
const FALLBACK_TEXT_ATTRIBUTES = ['aria-label', 'alt', 'title', 'placeholder'];
function normalizeText(value, maxLength = exports.MAX_TEXT_LENGTH) {
    const collapsed = value.replace(/\0/g, '').replace(/\s+/g, ' ').trim();
    const chars = Array.from(collapsed);
    if (chars.length <= maxLength)
        return collapsed;
    return chars.slice(0, maxLength).join('').trimEnd();
}
function collectText(element) {
    var _a;
    const walker = element.ownerDocument.createTreeWalker(element, SHOW_TEXT);
    let text = '';
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const parent = node.parentElement;
        if (parent && NON_VISIBLE_TEXT_PARENTS.has(parent.localName))
            continue;
        text += (_a = node.nodeValue) !== null && _a !== void 0 ? _a : '';
        if (text.length >= MAX_RAW_LENGTH)
            break;
    }
    return text;
}
function getElementText(element) {
    var _a;
    const text = normalizeText(collectText(element));
    if (text)
        return text;
    for (const name of FALLBACK_TEXT_ATTRIBUTES) {
        const value = normalizeText((_a = element.getAttribute(name)) !== null && _a !== void 0 ? _a : '');
        if (value)
            return value;
    }
    return '';
}
},
// src/shared/lib/pin-engine/restore.ts
function (module, exports, __require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreAnchor = restoreAnchor;
const number_1 = __require(6);
const selector_1 = __require(7);
const text_1 = __require(8);
function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
}
function pickCandidate(candidates, context) {
    var _a;
    const index = isFiniteNumber(context.index) ? context.index : 0;
    const preferred = (_a = candidates[index]) !== null && _a !== void 0 ? _a : candidates[0];
    const expectedText = context.element_text;
    if (!expectedText)
        return { element: preferred, textCheck: 'skipped' };
    if ((0, text_1.getElementText)(preferred) === expectedText)
        return { element: preferred, textCheck: 'match' };
    const byText = candidates.find((candidate) => (0, text_1.getElementText)(candidate) === expectedText);
    if (byText)
        return { element: byText, textCheck: 'match' };
    return { element: preferred, textCheck: 'mismatch' };
}
function getHiddenReason(element, rect) {
    if (element.closest('[hidden]'))
        return 'display-none';
    const view = element.ownerDocument.defaultView;
    if (view) {
        for (let node = element; node; node = node.parentElement) {
            const style = view.getComputedStyle(node);
            if (style.display === 'none')
                return 'display-none';
            if (style.opacity !== '' && Number.parseFloat(style.opacity) === 0)
                return 'opacity-zero';
        }
        const { visibility } = view.getComputedStyle(element);
        if (visibility === 'hidden' || visibility === 'collapse')
            return 'visibility-hidden';
    }
    if (rect.width <= 0 || rect.height <= 0)
        return 'zero-size';
    return null;
}
function getFallback(context) {
    const { page_x: pageX, page_y: pageY } = context;
    return isFiniteNumber(pageX) && isFiniteNumber(pageY) ? { pageX, pageY } : undefined;
}
function restoreAnchor(doc, anchor) {
    var _a, _b, _c;
    const context = (_a = anchor.location_context) !== null && _a !== void 0 ? _a : {};
    const candidates = (0, selector_1.queryAll)(doc, anchor.element_selector);
    if (!candidates) {
        return { status: 'missing', reason: 'invalid-selector', fallback: getFallback(context) };
    }
    if (candidates.length === 0) {
        return { status: 'missing', reason: 'no-match', fallback: getFallback(context) };
    }
    const { element, textCheck } = pickCandidate(candidates, context);
    const rect = element.getBoundingClientRect();
    const hiddenReason = getHiddenReason(element, rect);
    if (hiddenReason)
        return { status: 'hidden', element, textCheck, reason: hiddenReason };
    const view = doc.defaultView;
    const clientX = rect.left + rect.width * (0, number_1.clamp01)(anchor.relative_x);
    const clientY = rect.top + rect.height * (0, number_1.clamp01)(anchor.relative_y);
    return {
        status: 'found',
        element,
        textCheck,
        position: {
            clientX,
            clientY,
            pageX: clientX + ((_b = view === null || view === void 0 ? void 0 : view.scrollX) !== null && _b !== void 0 ? _b : 0),
            pageY: clientY + ((_c = view === null || view === void 0 ? void 0 : view.scrollY) !== null && _c !== void 0 ? _c : 0),
        },
    };
}
},
// src/shared/lib/pin-script/history.ts
function (module, exports, __require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPagePath = void 0;
exports.watchPagePath = watchPagePath;
const METHODS = ['pushState', 'replaceState'];
const getPagePath = (win) => win.location.pathname || '/';
exports.getPagePath = getPagePath;
function watchPagePath(win, onChange) {
    const { history } = win;
    let current = (0, exports.getPagePath)(win);
    const check = () => {
        const next = (0, exports.getPagePath)(win);
        if (next === current)
            return;
        current = next;
        onChange(next);
    };
    const originals = METHODS.map((method) => {
        const original = history[method];
        const wrapped = function (...args) {
            const result = original.apply(this, args);
            check();
            return result;
        };
        history[method] = wrapped;
        return { method, original, wrapped };
    });
    win.addEventListener('popstate', check);
    return () => {
        win.removeEventListener('popstate', check);
        for (const { method, original, wrapped } of originals) {
            if (history[method] === wrapped)
                history[method] = original;
        }
    };
}
},
// src/shared/lib/pin-script/overlay.ts
function (module, exports, __require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OVERLAY_TAG = void 0;
exports.createOverlay = createOverlay;
const theme_1 = __require(12);
exports.OVERLAY_TAG = 'respec-pin-root';
const MARKER_ATTRIBUTE = 'data-pin-id';
const FONT = `'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif`;
const TONE_STYLE = Object.keys(theme_1.PIN_TONE_COLORS)
    .map((tone) => `.marker[data-tone='${tone}'] .pin { background: ${theme_1.PIN_TONE_COLORS[tone]}; }`)
    .join('\n');
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
.marker:focus-visible { outline: 2px solid ${theme_1.PIN_COLORS.ink}; outline-offset: 2px; }
.pin {
  position: relative; box-sizing: border-box; display: grid; place-items: center;
  width: 38px; height: 38px; border-radius: 50% 50% 50% 8px; font-size: 15px;
  transform-origin: bottom left; transition-property: scale, background-color;
  transition-duration: 300ms; transition-timing-function: ${theme_1.PIN_EASING.spring};
  animation: pin-drop 0.45s ${theme_1.PIN_EASING['out-soft']} both;
}
${TONE_STYLE}
.marker:hover .pin { scale: 1.2; }
.marker[data-selected] .pin { scale: 1.2; background: ${theme_1.PIN_COLORS['brand-strong']}; }
.marker[data-alert]:not([data-selected]) .pin::after {
  content: ''; position: absolute; top: 1px; right: 1px; box-sizing: border-box;
  width: 10px; height: 10px; border: 2px solid #fff; border-radius: 50%;
  background: ${theme_1.PIN_COLORS.alert};
}
.marker[data-kind='review'] .pin { box-shadow: 0 0 0 2px #fff, 0 0 0 3.5px ${theme_1.PIN_COLORS.ink}; }
.marker[data-kind='draft'] { pointer-events: none; cursor: default; }
.marker[data-kind='draft'] .pin { background: ${theme_1.PIN_COLORS.ink}; }
@keyframes pin-drop { from { opacity: 0; translate: 0 -20px; } }
`;
function createOverlay(doc) {
    const host = doc.createElement(exports.OVERLAY_TAG);
    host.setAttribute('style', 'all: initial !important; position: fixed !important; inset: 0 !important; z-index: 2147483647 !important; pointer-events: none !important; display: block !important;');
    const root = host.attachShadow({ mode: 'open' });
    const style = doc.createElement('style');
    style.textContent = STYLE;
    const layer = doc.createElement('div');
    layer.className = 'layer';
    const markers = doc.createElement('div');
    root.append(style, layer, markers);
    doc.documentElement.append(host);
    const buttons = new Map();
    const createMarker = (pinId) => {
        const button = doc.createElement('button');
        button.type = 'button';
        button.className = 'marker';
        button.setAttribute(MARKER_ATTRIBUTE, pinId);
        const pin = doc.createElement('span');
        pin.className = 'pin';
        button.append(pin);
        return button;
    };
    const render = (items) => {
        const seen = new Set();
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
            if (item.kind === 'review')
                button.title = `핀 ${item.number} 반영 위치`;
            else
                button.removeAttribute('title');
            button.tabIndex = isDraft ? -1 : 0;
            if (isDraft)
                button.setAttribute('aria-hidden', 'true');
            else
                button.removeAttribute('aria-hidden');
            button.setAttribute('aria-pressed', String(item.selected));
            button.setAttribute('data-tone', item.tone);
            button.setAttribute('data-kind', item.kind);
            button.toggleAttribute('data-alert', item.alert && !isDraft);
            button.toggleAttribute('data-selected', item.selected && !isDraft);
            button.style.left = `${item.clientX}px`;
            button.style.top = `${item.clientY}px`;
        }
        for (const [pinId, button] of buttons) {
            if (seen.has(pinId))
                continue;
            button.remove();
            buttons.delete(pinId);
        }
    };
    const hitTest = (event) => {
        var _a, _b;
        for (const target of event.composedPath()) {
            if (target === layer)
                return { kind: 'layer' };
            if (target === host)
                return null;
            const pinId = (_b = (_a = target).getAttribute) === null || _b === void 0 ? void 0 : _b.call(_a, MARKER_ATTRIBUTE);
            if (pinId)
                return { kind: 'marker', pinId };
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
},
// src/shared/lib/pin-script/theme.ts
function (module, exports, __require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PIN_TONE_COLORS = exports.PIN_EASING = exports.PIN_COLORS = void 0;
exports.PIN_COLORS = {
    brand: '#5647e0',
    'brand-strong': '#3f31c9',
    ink: '#18181b',
    text: '#3f3f46',
    muted: '#84848c',
    faint: '#b4b4bb',
    warn: '#c4670f',
    'brand-quiet': '#b7b0f2',
    'pin-done': '#c4c4cc',
    alert: '#e5484d',
};
exports.PIN_EASING = {
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    'out-soft': 'cubic-bezier(0.22, 1, 0.36, 1)',
};
exports.PIN_TONE_COLORS = {
    brand: exports.PIN_COLORS.brand,
    quiet: exports.PIN_COLORS['brand-quiet'],
    done: exports.PIN_COLORS['pin-done'],
};
},
// src/shared/lib/pin-script/script-origin.ts
function (module, exports, __require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllowedOrigins = getAllowedOrigins;
exports.findPinScript = findPinScript;
const pin_bridge_1 = __require(2);
function getAllowedOrigins(script) {
    if (!script)
        return [];
    const attribute = script.getAttribute(pin_bridge_1.PIN_SCRIPT_ORIGIN_ATTRIBUTE);
    const candidates = attribute ? attribute.split(/[\s,]+/) : [script.src];
    const origins = candidates.flatMap((value) => { var _a; return (_a = (0, pin_bridge_1.toOrigin)(value)) !== null && _a !== void 0 ? _a : []; });
    return Array.from(new Set(origins));
}
function findPinScript(doc) {
    var _a;
    const current = doc.currentScript;
    if ((current === null || current === void 0 ? void 0 : current.localName) === 'script' && 'src' in current)
        return current;
    const scripts = Array.from(doc.querySelectorAll('script[src]'));
    return (_a = scripts.find((script) => script.src.includes(pin_bridge_1.PIN_SCRIPT_PATH))) !== null && _a !== void 0 ? _a : null;
}
}
  ];
  var cache = [];
  function __require(id) {
    if (cache[id]) return cache[id].exports;
    var module = (cache[id] = { exports: {} });
    modules[id](module, module.exports, __require);
    return module.exports;
  }
  __require(0);
})();
