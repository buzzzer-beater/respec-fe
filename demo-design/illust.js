/*
 * RE:SPEC 아이콘
 * - illust(name): 그라데이션과 하이라이트로 입체감을 낸 작은 일러스트 (레퍼런스의 AI 3D 아이콘 느낌)
 * - icon(name): 화면 곳곳에 쓰는 선 아이콘 (Lucide 스타일, 24×24)
 * HTML에서는 <span data-illust="pin"></span>, <span data-icon="send"></span>로 쓰고 hydrate()가 채웁니다.
 */
(function () {
  var uid = 0;

  // 일러스트마다 그라데이션 id가 겹치지 않게 접미사를 붙입니다.
  function grad(id, stops, x2, y2) {
    return (
      '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (x2 || 0.4) + '" y2="' + (y2 || 1) + '">' +
      stops.map(function (s, i) {
        return '<stop offset="' + i / (stops.length - 1) + '" stop-color="' + s + '"/>';
      }).join('') +
      '</linearGradient>'
    );
  }

  var GLOSS = '<radialGradient id="gloss$" cx="0.3" cy="0.25" r="0.6"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>';
  var GROUND = '<ellipse cx="32" cy="60" rx="17" ry="3" fill="rgba(20,50,120,.13)"/>';

  var ILLUST = {
    pin: function () {
      return {
        defs: grad('a$', ['#9cc0ff', '#4d86ff', '#1f55e0']) + GLOSS,
        body:
          GROUND +
          '<path d="M32 6c-10.5 0-19 8-19 18.4C13 38 32 57 32 57s19-19 19-32.6C51 14 42.5 6 32 6z" fill="url(#a$)"/>' +
          '<circle cx="32" cy="24" r="8" fill="#fff"/><circle cx="32" cy="24" r="3.6" fill="#2f6bff"/>' +
          '<path d="M32 6c-10.5 0-19 8-19 18.4C13 38 32 57 32 57s19-19 19-32.6C51 14 42.5 6 32 6z" fill="url(#gloss$)"/>',
      };
    },
    chat: function () {
      return {
        defs: grad('a$', ['#cfe0ff', '#6fa0ff', '#3a6ff0']) + GLOSS,
        body:
          GROUND +
          '<path d="M22 44 14 56l18-10z" fill="#3d72f2"/>' +
          '<rect x="7" y="10" width="50" height="38" rx="16" fill="url(#a$)"/>' +
          '<circle cx="21" cy="29" r="3.6" fill="#fff"/><circle cx="32" cy="29" r="3.6" fill="#fff"/><circle cx="43" cy="29" r="3.6" fill="#fff"/>' +
          '<rect x="7" y="10" width="50" height="38" rx="16" fill="url(#gloss$)"/>',
      };
    },
    sparkle: function () {
      return {
        defs: grad('a$', ['#c8f0ff', '#7aa7ff', '#2f6bff'], 1, 1) + grad('b$', ['#ffe58a', '#ffb648']) + GLOSS,
        body:
          GROUND +
          '<path d="M28 7c2.2 14 6.5 19.5 21 22.5-14.5 3-18.8 8.5-21 22.5-2.2-14-6.5-19.5-21-22.5C21.5 26.5 25.8 21 28 7z" fill="url(#a$)"/>' +
          '<path d="M49 5c.9 5.2 2.5 7.2 7.5 8.2-5 1-6.6 3-7.5 8.2-.9-5.2-2.5-7.2-7.5-8.2 5-1 6.6-3 7.5-8.2z" fill="url(#b$)"/>' +
          '<path d="M28 7c2.2 14 6.5 19.5 21 22.5-14.5 3-18.8 8.5-21 22.5-2.2-14-6.5-19.5-21-22.5C21.5 26.5 25.8 21 28 7z" fill="url(#gloss$)"/>',
      };
    },
    check: function () {
      return {
        defs: grad('a$', ['#7ee2b0', '#2fb978', '#168a57']) + GLOSS,
        body:
          GROUND +
          '<circle cx="32" cy="30" r="22" fill="url(#a$)"/>' +
          '<path d="M21.5 30.5 29 38l14-15" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>' +
          '<circle cx="32" cy="30" r="22" fill="url(#gloss$)"/>',
      };
    },
    search: function () {
      return {
        defs: grad('a$', ['#9cc0ff', '#2f6bff']) + grad('b$', ['#ffffff', '#dde8ff']) + GLOSS,
        body:
          GROUND +
          '<path d="M39 39 52 52" stroke="#1a46c4" stroke-width="9" stroke-linecap="round"/>' +
          '<circle cx="27" cy="27" r="17" fill="url(#b$)" stroke="url(#a$)" stroke-width="7"/>' +
          '<circle cx="27" cy="27" r="17" fill="url(#gloss$)"/>',
      };
    },
    folder: function () {
      return {
        defs: grad('a$', ['#ffe08a', '#f5a524']) + grad('b$', ['#fff1bd', '#ffc94d']) + GLOSS,
        body:
          GROUND +
          '<path d="M7 17a6 6 0 0 1 6-6h12.5l5.5 6h20a6 6 0 0 1 6 6v24a7 7 0 0 1-7 7H14a7 7 0 0 1-7-7z" fill="url(#a$)"/>' +
          '<path d="M7 26h50v21a7 7 0 0 1-7 7H14a7 7 0 0 1-7-7z" fill="url(#b$)"/>' +
          '<path d="M7 26h50v21a7 7 0 0 1-7 7H14a7 7 0 0 1-7-7z" fill="url(#gloss$)"/>',
      };
    },
    rocket: function () {
      return {
        defs: grad('a$', ['#ffffff', '#dbe6ff']) + grad('b$', ['#ffd166', '#ff7a45']) + grad('c$', ['#6fa0ff', '#2f6bff']) + GLOSS,
        body:
          GROUND +
          '<path d="M25 42h14l-7 16z" fill="url(#b$)"/>' +
          '<path d="M21 30 12 42l10 1zM43 30l9 12-10 1z" fill="url(#c$)"/>' +
          '<path d="M32 5c10 7.5 14 19 12 37H20C18 24 22 12.5 32 5z" fill="url(#a$)"/>' +
          '<circle cx="32" cy="24" r="6" fill="url(#c$)" stroke="#fff" stroke-width="2.5"/>' +
          '<path d="M32 5c10 7.5 14 19 12 37H20C18 24 22 12.5 32 5z" fill="url(#gloss$)"/>',
      };
    },
    bell: function () {
      return {
        defs: grad('a$', ['#ffe58a', '#ffb627', '#f08a24']) + GLOSS,
        body:
          GROUND +
          '<circle cx="32" cy="49" r="6" fill="#f07a24"/>' +
          '<path d="M32 7a3.5 3.5 0 0 1 3.5 3.5v1.8C43.4 14 48 20.6 48 28.4V38l5 7H11l5-7v-9.6c0-7.8 4.6-14.4 12.5-16.1v-1.8A3.5 3.5 0 0 1 32 7z" fill="url(#a$)"/>' +
          '<path d="M32 7a3.5 3.5 0 0 1 3.5 3.5v1.8C43.4 14 48 20.6 48 28.4V38l5 7H11l5-7v-9.6c0-7.8 4.6-14.4 12.5-16.1v-1.8A3.5 3.5 0 0 1 32 7z" fill="url(#gloss$)"/>',
      };
    },
    clipboard: function () {
      return {
        defs: grad('a$', ['#ffffff', '#e8efff']) + grad('b$', ['#6fa0ff', '#2f6bff']) + GLOSS,
        body:
          GROUND +
          '<rect x="12" y="10" width="40" height="46" rx="9" fill="url(#b$)"/>' +
          '<rect x="16" y="15" width="32" height="37" rx="6" fill="url(#a$)"/>' +
          '<rect x="24" y="6" width="16" height="9" rx="4.5" fill="#1a46c4"/>' +
          '<path d="M22 27h20M22 35h14" stroke="#bcd0fb" stroke-width="3.5" stroke-linecap="round"/>' +
          '<path d="m30 44 4 4 8-8" fill="none" stroke="#22a06b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' +
          '<rect x="12" y="10" width="40" height="46" rx="9" fill="url(#gloss$)"/>',
      };
    },
    link: function () {
      return {
        defs: grad('a$', ['#9cc0ff', '#2f6bff'], 1, 1) + grad('b$', ['#7ee2b0', '#22a06b'], 1, 1),
        body:
          GROUND +
          '<rect x="6" y="22" width="30" height="18" rx="9" transform="rotate(-35 21 31)" fill="none" stroke="url(#a$)" stroke-width="7"/>' +
          '<rect x="28" y="22" width="30" height="18" rx="9" transform="rotate(-35 43 31)" fill="none" stroke="url(#b$)" stroke-width="7"/>',
      };
    },
  };

  function illust(name, size) {
    var item = ILLUST[name];
    if (!item) return '';
    var part = item();
    var suffix = '-' + ++uid;
    var fix = function (text) {
      return text.replace(/\$/g, suffix);
    };
    return (
      '<svg class="illust" viewBox="0 0 64 64" width="' + (size || 48) + '" height="' + (size || 48) + '" aria-hidden="true">' +
      '<defs>' + fix(part.defs) + '</defs>' + fix(part.body) + '</svg>'
    );
  }

  var ICON = {
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    viewer: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    wand: '<path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72M14 7l3 3M5 6v4M19 14v4M10 2v2M7 8H3M21 16h-4M11 3H9"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    settings: '<path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4"/>',
    panel: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    tablet: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M12 18h.01"/>',
    phone: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M12 18h.01"/>',
    cursor: '<path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/>',
    comment: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    minus: '<path d="M5 12h14"/>',
    send: '<path d="m5 12 7-7 7 7M12 19V5"/>',
    clip: '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
    at: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>',
    sort: '<path d="m21 16-4 4-4-4M17 20V4M3 8l4-4 4 4M7 4v16"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    updown: '<path d="m7 15 5 5 5-5M7 9l5-5 5 5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5"/>',
    external: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    sparkle: '<path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.13-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.13a.5.5 0 0 1 .96 0L14.06 8.5A2 2 0 0 0 15.5 9.94l6.13 1.58a.5.5 0 0 1 0 .96L15.5 14.06a2 2 0 0 0-1.44 1.44l-1.58 6.13a.5.5 0 0 1-.96 0z"/>',
    pin: '<path d="M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    share: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>',
    reply: '<path d="m15 10 5 5-5 5M4 4v7a4 4 0 0 0 4 4h12"/>',
    undo: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    fit: '<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>',
    hash: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    hand: '<path d="M18 11V6a2 2 0 0 0-4 0v1M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
    chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  };

  function icon(name, size) {
    var s = size || 18;
    return (
      '<svg class="icon" viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON[name] || '') + '</svg>'
    );
  }

  function hydrate(root) {
    (root || document).querySelectorAll('[data-illust]').forEach(function (el) {
      el.innerHTML = illust(el.dataset.illust, Number(el.dataset.size) || undefined);
    });
    (root || document).querySelectorAll('[data-icon]').forEach(function (el) {
      el.innerHTML = icon(el.dataset.icon, Number(el.dataset.size) || undefined);
    });
  }

  window.RESPEC = { illust: illust, icon: icon, hydrate: hydrate, ILLUSTS: Object.keys(ILLUST) };
  document.addEventListener('DOMContentLoaded', function () {
    hydrate();
  });
})();
