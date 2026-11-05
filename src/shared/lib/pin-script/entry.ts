/**
 * `public/respec-pin.js`의 시작점입니다. `scripts/build-pin-script.mjs`가 이 파일을 묶어 만듭니다.
 * 앱 코드에서 import하지 않습니다.
 */
import { startPinScript } from './runtime';
import { findPinScript, getAllowedOrigins } from './script-origin';

type PinScriptWindow = Window & { __respecPin?: boolean };

function main(win: PinScriptWindow) {
  // RE:SPEC 워크스페이스 iframe 안에서만 동작합니다. 사이트를 직접 열었을 때는 아무것도 하지 않습니다.
  if (win.parent === win || win.__respecPin) return;
  const allowedOrigins = getAllowedOrigins(findPinScript(win.document));
  if (allowedOrigins.length === 0) return;
  win.__respecPin = true;

  const start = () => startPinScript({ win, parent: win.parent, allowedOrigins });
  if (win.document.documentElement) start();
  else win.addEventListener('DOMContentLoaded', start, { once: true });
}

main(window);
