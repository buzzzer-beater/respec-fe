// RE:SPEC 작업 화면 — 사이트를 크게 보면서 이 페이지의 핀만 다룹니다. (공용 데이터: common.js)
// 기본값: 초안 A(morrow-a) = 5174, 배포본 B(morrow-b) = 5173. 다른 주소는 ?a=…&b=… 로 바꿀 수 있습니다.
// 초안 핀은 초안에만 있고, 배포본에는 개발자가 검수 요청 때 다시 찍은 "반영 위치"가 보입니다. (백엔드 요청: pins.source, review item location)
const params = new URLSearchParams(location.search);
const SITES = {
  A: params.get('a') || 'http://localhost:5174',
  // 시연에서는 연결한 배포 주소와 상관없이 로컬 morrow-b를 띄웁니다.
  B: params.get('b') || 'http://localhost:5173',
};

const state = {
  site: 'A', path: '/', device: 'desktop',
  mode: 'browse',
  connected: null, selected: null, draft: null,
  chatOpen: false, redo: false, scrollTarget: null, full: false,
  aiPending: new Set(), aiOpen: new Set(),
  showDone: false,
  zoom: 1, // 미리보기 확대 비율 (50~150%)
  hist: [], histAt: -1, // 사이트 안 이동 기록 (뒤로/앞으로)
  placing: null, // { type: 'review' | 'relocate', id } — 사이트를 눌러 위치를 정하는 중
  review: null, // 검수 요청 만드는 중: { items: { [요청 id]: { checked, note, pos, err } } }
  editing: null, deleting: null, // 내 답글 수정·삭제 중
};
const positions = {}; // 핀 id(검수 위치는 'rv:'+id) → { x, y, found }
const isMyTurn = (req) => isMyTurnFor(req, currentRole);
const findReq = (id) => requests.find((r) => r.id === id);

function confetti(x, y) {
  for (let i = 0; i < 16; i++) {
    const angle = (Math.PI * 2 * i) / 16;
    const dist = 40 + Math.random() * 40;
    const el = h('span', {
      class: 'confetti',
      style: `left:${x}px;top:${y}px;--dx:${Math.cos(angle) * dist}px;--dy:${Math.sin(angle) * dist - 24}px;--rot:${Math.random() * 360}deg`,
    });
    document.body.append(el);
    setTimeout(() => el.remove(), 900);
  }
}

// ─── AI 정리 (시연용 예시 문장) ──────────────────────────
const AREA = {
  hero: '메인 배너(hero)',
  catalog: '상품 목록(catalog)',
  header: '상단 헤더(header)',
  'add-to-cart': '장바구니 버튼(add-to-cart)',
  'product-detail': '상품 상세(product-detail)',
};
function areaLabel(respecId) {
  return AREA[respecId] || (respecId?.startsWith('product-') ? `상품 카드(${respecId})` : '선택한 화면 요소');
}
function aiForClient(req) {
  return `${areaLabel(req.respecId)} 수정 요청\n· 고객 요청: "${req.text}"\n· 페이지: ${req.path}${req.pickText ? `\n· 선택한 글자: "${req.pickText}"` : ''}\n· 확인 필요: 구체적인 크기·색상 값은 대화로 정해요`;
}

function runAi(target, make) {
  state.aiPending.add(target);
  render();
  setTimeout(() => {
    target.ai = make();
    state.aiPending.delete(target);
    render();
  }, 1200);
}

// ─── 핀 위치: 요청이 지금 보는 사이트에서 어디에 있는지 ─────────
// 초안 핀은 그 사이트에서만, 배포본에서는 개발자가 검수 요청 때 찍은 반영 위치를 씁니다.
function posFor(req, site) {
  if (req.noLocation) return null;
  if (req.site === site) return req;
  if (site === 'B' && req.review?.pos) return req.review.pos;
  return null;
}
const pinOf = (req) => posFor(req, state.site);
const siteBase = () => (state.site === 'B' ? hostOf(deployment || 'https://배포 전') : 'draft.respec.app/morrow');
const isReviewMark = (req) => req.site !== state.site;

// ─── 전체 화면 ──────────────────────────────────────────
function setFull(on) {
  state.full = on;
  $('#app').classList.toggle('is-full', on);
  $('#fullBtn').title = on ? '전체 화면 나가기 (Esc)' : '전체 화면 (F)';
  if (on && !document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
  if (!on && document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  if (on && state.chatOpen) setChat(false);
  setTimeout(relocateSoon, 300);
}
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && state.full) setFull(false);
});

function setDevice(device) {
  state.device = device;
  syncSegment($('#deviceSwitch'), device);
  $('#browser').dataset.device = device;
  setTimeout(relocateSoon, 350);
}

// ─── 확대/축소 ──────────────────────────────────────────
// 사이트(iframe)와 핀 레이어를 한 상자에 넣고 함께 비율을 바꿔서 핀 위치가 어긋나지 않게 합니다.
function setZoom(z) {
  state.zoom = Math.min(1.5, Math.max(0.5, Math.round(z * 10) / 10));
  const box = $('#zoomBox');
  box.style.zoom = state.zoom;
  box.style.width = box.style.height = `${100 / state.zoom}%`;
  $('#zoomValue').textContent = `${Math.round(state.zoom * 100)}%`;
  $('#zoomIn').disabled = state.zoom >= 1.5;
  $('#zoomOut').disabled = state.zoom <= 0.5;
  relocateSoon();
}

// ─── 뒤로/앞으로: 사이트 안에서 이동한 페이지 기록 ────────────
function remember(path) {
  if (state.hist[state.histAt] === path) return;
  state.hist = state.hist.slice(0, state.histAt + 1).concat(path);
  state.histAt = state.hist.length - 1;
  syncNav();
}
function syncNav() {
  $('#navBack').disabled = state.histAt <= 0;
  $('#navFwd').disabled = state.histAt >= state.hist.length - 1;
}
function goHistory(step) {
  const at = state.histAt + step;
  if (at < 0 || at >= state.hist.length) return;
  state.histAt = at;
  syncNav();
  if (!state.review) state.selected = null;
  loadSite(state.hist[at]);
}

// ─── 사이트 미리보기와 핀 스크립트 ─────────────────────────
const frame = $('#frame');
let connectTimer;
let locateId = 0;
const locateWaits = {};

function loadSite(path = '/') {
  state.path = path;
  state.connected = null;
  state.draft = null;
  Object.keys(positions).forEach((k) => delete positions[k]);
  setConn();
  $('#url').value = SITES[state.site].replace(/\/$/, '') + path;
  frame.src = $('#url').value;
  render();
}

function switchSite(site, path = '/') {
  state.site = site;
  state.hist = [];
  state.histAt = -1;
  $('#siteSelect').value = site;
  if (state.placing && site !== 'B') state.placing = null;
  loadSite(path);
  refreshDropdowns();
}

frame.addEventListener('load', () => {
  clearTimeout(connectTimer);
  // 2초 안에 핀 스크립트가 응답하지 않으면 스크립트가 없는 사이트로 봅니다.
  connectTimer = setTimeout(() => {
    if (state.connected) return;
    state.connected = false;
    setConn();
    if (state.mode === 'pin') setMode('browse');
    renderPins();
  }, 2000);
});

function setConn() {
  const el = $('#conn');
  const map = { true: ['on', '핀 스크립트 연결됨'], false: ['off', '핀 스크립트 없음'], null: ['wait', '연결 확인 중'] };
  const [s, label] = map[String(state.connected)];
  el.dataset.state = s;
  el.title = label;
  const dev = currentRole === 'developer';
  $('#scriptGuide').hidden = state.connected !== false;
  $('#scriptGuideText').textContent = dev
    ? '이 사이트에 핀 스크립트가 없어서 핀을 찍을 수 없어요'
    : '이 사이트에 핀 스크립트가 없어서 핀을 찍을 수 없어요 · 개발자에게 설치를 요청해 주세요';
  $('#scriptGuideBtn').hidden = !dev;
}

function send(message) {
  frame.contentWindow?.postMessage({ source: 'respec', ...message }, '*');
}

let relocateTimers = [];
function relocateSoon() {
  relocateTimers.forEach(clearTimeout);
  relocateTimers = [0, 300, 900, 1800].map((ms) => setTimeout(locateAll, ms));
}

function locate(key, pos) {
  const requestId = ++locateId;
  locateWaits[requestId] = key;
  send({ type: 'locate', requestId, selector: pos.selector, relativeX: pos.rx, relativeY: pos.ry });
}

function locateAll() {
  if (!state.connected) return;
  pagePins().forEach((req) => {
    const p = pinOf(req);
    if (p.selector) locate(req.id, p);
  });
  reviewMarks().forEach(([id, it]) => locate('rv:' + id, it.pos));
}

window.addEventListener('message', (event) => {
  if (event.source !== frame.contentWindow) return;
  const data = event.data;
  if (!data || data.source !== 'respec-site') return;
  if (data.type === 'location') {
    const first = !state.connected;
    state.connected = true;
    if (data.path !== state.path && !state.review) state.selected = null;
    state.path = data.path;
    remember(data.path);
    $('#url').value = SITES[state.site].replace(/\/$/, '') + data.path;
    setConn();
    send({ type: 'pin-mode', enabled: state.mode === 'pin' });
    if (!first) state.draft = null;
    relocateSoon();
    const target = findReq(state.scrollTarget);
    if (target && pinOf(target)?.path === data.path) {
      state.scrollTarget = null;
      setTimeout(() => scrollToPin(target), 400);
    }
    render();
  }
  if (data.type === 'viewport') locateAll();
  if (data.type === 'located') {
    const id = locateWaits[data.requestId];
    delete locateWaits[data.requestId];
    if (id === 'draft' && state.draft) Object.assign(state.draft, { x: data.x, y: data.y });
    else if (id) positions[id] = { x: data.x, y: data.y, found: data.found };
    renderPins();
  }
  if (data.type === 'pick') {
    if (state.full) setFull(false);
    const pos = { path: data.path, selector: data.selector, respecId: data.respecId, rx: data.relativeX, ry: data.relativeY };
    if (state.placing) return place(pos);
    if (currentRole !== 'client') return;
    state.draft = { ...pos, pickText: data.text };
    state.selected = null;
    locate('draft', pos);
    render();
  }
});

// 검수 위치·새 위치를 정하는 중에 사이트를 누르면 그 자리로 저장합니다.
function place(pos) {
  const { type, id } = state.placing;
  const req = findReq(id);
  state.placing = null;
  setMode('browse');
  if (type === 'review' && state.review?.items[id]) {
    Object.assign(state.review.items[id], { pos, err: null });
    toast(`핀 ${req.no} 반영 위치를 찍었어요`);
  } else if (type === 'relocate') {
    if (req.site === state.site) Object.assign(req, { path: pos.path, selector: pos.selector, respecId: pos.respecId, rx: pos.rx, ry: pos.ry });
    else if (req.review) req.review.pos = pos;
    delete positions[req.id];
    toast(`핀 ${req.no} 위치를 옮겼어요`);
  }
  relocateSoon();
  render();
}

function pagePins() {
  return requests.filter((r) => pinOf(r)?.path === state.path);
}

// 검수 요청을 만드는 중 배포본에 찍어 둔 반영 위치
function reviewMarks() {
  if (!state.review || state.site !== 'B') return [];
  return Object.entries(state.review.items).filter(([, it]) => it.pos && it.pos.path === state.path);
}

function pinPoint(key) {
  const pos = state.connected && positions[key];
  return pos && pos.found ? pos : null;
}

function renderPins() {
  const layer = $('#pinLayer');
  const keep = new Set();
  pagePins().forEach((req) => {
    const point = pinPoint(req.id);
    const done = req.status === 'done';
    if (!point || (done && !state.showDone && state.selected !== req.id)) return;
    const important = state.selected === req.id || (!done && isMyTurn(req));
    keep.add(req.id);
    let pin = layer.querySelector(`[data-id="${req.id}"]`);
    if (!pin) {
      pin = h('button', { class: 'pin', 'data-id': req.id, 'aria-label': `핀 ${req.no}`, onclick: () => select(req.id, false) }, req.no);
      layer.append(pin);
    }
    pin.dataset.status = req.status;
    pin.classList.toggle('is-selected', state.selected === req.id);
    pin.classList.toggle('is-quiet', !important && !done);
    pin.classList.toggle('has-new', !done && isMyTurn(req) && state.selected !== req.id);
    pin.classList.toggle('is-review', isReviewMark(req));
    pin.title = isReviewMark(req) ? `핀 ${req.no} 반영 위치` : `핀 ${req.no}`;
    pin.style.left = point.x + 'px';
    pin.style.top = point.y + 'px';
  });
  layer.querySelectorAll('.pin:not(.is-draft)').forEach((pin) => {
    if (!keep.has(pin.dataset.id)) pin.remove();
  });
  layer.querySelectorAll('.is-draft').forEach((pin) => pin.remove());
  reviewMarks().forEach(([id]) => {
    const point = pinPoint('rv:' + id);
    if (point) layer.append(h('span', { class: 'pin is-draft', style: `left:${point.x}px;top:${point.y}px` }, findReq(id).no));
  });
  const d = state.draft;
  if (d && d.x != null) layer.append(h('span', { class: 'pin is-draft', style: `left:${d.x}px;top:${d.y}px` }, nextNo));
}

// ─── 모드 ───────────────────────────────────────────────
function setMode(mode) {
  if (mode === 'pin') {
    if (state.connected === false) {
      toast('이 사이트에는 핀 스크립트가 없어서 핀을 찍을 수 없어요');
      return;
    }
    if (currentRole === 'developer' && !state.placing) {
      toast('개발자는 검수 요청을 만들 때 반영 위치를 찍어요');
      return;
    }
  }
  if (mode !== 'pin' && state.placing) {
    state.placing = null;
    renderPanel();
  }
  state.mode = mode;
  $('#app').classList.toggle('pin-mode', mode === 'pin');
  syncSegment($('#modeSwitch'), mode);
  const p = state.placing && findReq(state.placing.id);
  $('#modeHint').textContent = p
    ? `핀 ${p.no}의 ${state.placing.type === 'review' ? '반영 위치' : '새 위치'}를 눌러 주세요 · Esc로 취소`
    : '바꾸고 싶은 곳을 눌러 주세요 · Esc로 나가기';
  send({ type: 'pin-mode', enabled: mode === 'pin' });
  if (mode !== 'pin' && state.draft) {
    state.draft = null;
    render();
  }
}

function startPlacing(type, id) {
  state.placing = { type, id };
  setMode('pin');
  if (state.mode !== 'pin') state.placing = null;
  renderPanel();
}

function scrollToPin(req) {
  const p = pinOf(req);
  if (p?.selector) send({ type: 'scroll-to', selector: p.selector });
}

// 목록에서 열면 그 핀이 있는 사이트·페이지로 옮겨 스크롤합니다. 검수 중·완료 요청은 배포본의 반영 위치로 갑니다.
function select(id, scroll = true) {
  const req = findReq(id);
  if (!req) return;
  Object.assign(state, { selected: id, draft: null, redo: false, editing: null, deleting: null });
  if (scroll && !req.noLocation) {
    const prefer = ['review', 'done'].includes(req.status) && req.review?.pos && deployment ? 'B' : req.site;
    const target = posFor(req, state.site) && state.site === prefer ? state.site : prefer;
    const p = posFor(req, target);
    if (target !== state.site) {
      state.scrollTarget = id;
      switchSite(target, p.path);
      return;
    }
    if (p.path !== state.path) {
      state.scrollTarget = id;
      loadSite(p.path);
      return;
    }
    if (state.connected) scrollToPin(req);
  }
  render();
}

// ─── 전체 다시 그리기 ───────────────────────────────────
function render() {
  renderTop();
  renderPanel();
  renderPins();
  if (state.chatOpen) renderChat();
  saveData();
}

function renderTop() {
  const dev = currentRole === 'developer';
  const paths = new Set(['/', state.path]);
  requests.forEach((r) => pinOf(r) && paths.add(pinOf(r).path));
  const select = $('#pageSelect');
  select.replaceChildren(
    ...[...paths].map((p) => {
      const count = requests.filter((r) => pinOf(r)?.path === p && r.status !== 'done').length;
      return h('option', { value: p, 'data-sub': count ? `핀 ${count}` : null }, siteBase() + (p === '/' ? '' : p));
    }),
  );
  select.value = state.path;
  // 마지막 업데이트: 초안은 초안 생성 시각(draft.updated_at), 배포본은 배포 시각 (백엔드 요청: deployment_updated_at)
  $('#updatedAt').textContent = state.site === 'B' ? '마지막 배포 · 3일 전' : '초안 생성 · 5일 전';
  $('#siteSelect').querySelector('[value="B"]').dataset.sub = deployment ? '개발자 배포' : '연결 전';
  const mine = requests.filter(isMyTurn).length;
  $('#navCount').textContent = mine;
  $('#navCount').hidden = !mine;
  $('#chatCount').textContent = messages.filter((m) => m.type !== 'system').length;

  // 배포 주소: 개발자는 눌러서 연결·변경, 고객은 보기만. 연결 전에는 초안 코드 받기
  const chip = $('#deployChip');
  chip.hidden = !deployment && !dev;
  chip.disabled = !dev;
  chip.classList.toggle('is-empty', !deployment);
  chip.title = dev ? (deployment ? '배포 주소 변경' : '배포 주소 연결') : '연결된 배포 주소';
  chip.replaceChildren(...(deployment ? [h('span', { class: 'dot' }), h('span', {}, hostOf(deployment))] : [icon('link', 13), h('span', {}, '배포 연결')]));
  $('#zipBtn').hidden = !!deployment;
  $('#people').replaceChildren(avatar('client'), avatar('developer'));
  $('#inviteBtn').hidden = dev;
  $('#newRequest').hidden = dev;
  $('#reviewBtn').hidden = !dev;
  const working = requests.filter((r) => r.status === 'working').length;
  $('#reviewBtn').textContent = working ? `검수 요청 만들기 · 작업 중 ${working}` : '검수 요청 만들기';
  refreshDropdowns();
}

// ─── 오른쪽 패널 ─────────────────────────────────────────
function renderPanel() {
  const view = state.review ? 'review' : state.draft ? 'new' : state.selected ? 'detail' : 'list';
  $('#app').dataset.view = view;
  const body = $('#panelBody');
  const keep = view === 'list' || view === 'review' ? body.scrollTop : 0;
  const make = { review: renderReview, new: renderNew, detail: renderDetail, list: renderList }[view];
  body.replaceChildren(make());
  body.scrollTop = keep;
}

function renderList() {
  const here = pagePins();
  const open = here.filter((r) => r.status !== 'done');
  const focus = open.find(isMyTurn);
  const rest = (state.showDone ? here : open).filter((r) => r !== focus);
  const elsewhere = requests.filter((r) => r.status !== 'done' && pinOf(r)?.path !== state.path).length;
  const calm = currentRole === 'developer' ? '지금 이 페이지에는 할 일이 없어요.' : '지금은 개발자 차례예요. 답이 오면 여기에 먼저 보여 드릴게요.';
  return h(
    'div',
    { class: 'list-view' },
    h('h2', { class: 'panel-title' }, '이 페이지 요청 ', h('em', {}, open.length)),
    focus ? renderFocus(focus) : h('div', { class: 'calm' }, calm),
    rest.length > 0 && h('div', { class: 'rows' }, rest.map(renderItem)),
    !here.length && h('p', { class: 'list-empty' }, state.site === 'B' ? '배포본의 이 페이지에는 아직 핀이 없어요.' : '이 페이지에는 아직 핀이 없어요.'),
    elsewhere > 0 && h('a', { class: 'elsewhere', href: linkTo('requests.html') }, `다른 페이지 요청 ${elsewhere}개 보기`, icon('right', 14)),
  );
}

function renderFocus(req) {
  const verb = currentRole === 'client' ? '반영 위치를 보고 승인해 주세요' : req.status === 'working' ? '검수 요청에 담기' : DEV_NEXT[req.status][1];
  return h(
    'button',
    { class: 'focus', onclick: () => select(req.id) },
    h('span', { class: 'focus-label' }, '지금 할 일'),
    h('span', { class: 'focus-main' }, h('span', { class: 'pin-no' }, req.no), h('span', { class: 'focus-text' }, req.text)),
    h('span', { class: 'focus-foot' }, verb, icon('right', 16)),
  );
}

function renderItem(req) {
  return h(
    'button',
    { class: 'row-item', 'data-status': req.status, onclick: () => select(req.id) },
    h('span', { class: 'pin-no' }, req.no),
    h('span', { class: 'row-title' }, req.text),
    isReviewMark(req) && h('span', { class: 'row-tag' }, '반영 위치'),
    h('span', { class: 'row-status' }, STATUS[STATUS_INDEX[req.status]].label),
  );
}

const EVENT_TEXT = {
  checking: '요청을 확인하기 시작했어요',
  working: '수정 작업을 시작했어요',
  review: '수정을 마치고 검수를 요청했어요',
  done: '수정 결과를 승인했어요',
  waiting: '재수정을 요청했어요',
};

function renderAiSummary(text) {
  const lines = text.split('\n').filter(Boolean);
  const title = lines[0].startsWith('·') ? null : lines.shift();
  return h('div', { class: 'ai-summary' }, title && h('b', {}, title), h('ul', {}, lines.map((line) => h('li', {}, line.replace(/^·\s*/, '')))));
}

// 요청 상세: 요청 → (검수 중이면) 반영 내용 → 대화
function renderDetail() {
  const req = findReq(state.selected);
  const step = STATUS_INDEX[req.status];
  const p = pinOf(req);
  const point = p && p.path === state.path && state.connected && positions[req.id];
  const lost = point && !point.found;
  const talk = req.replies.filter((r) => !r.event).length;
  const locked = req.status === 'done';

  return h(
    'div',
    { class: 'detail' },
    h(
      'header',
      { class: 'detail-top' },
      h('button', { class: 'back', onclick: () => { state.selected = null; render(); }, 'aria-label': '목록으로' }, icon('left', 18)),
      h('span', { class: 'pin-no' }, req.no),
      h('h2', {}, `핀 ${req.no}`),
      h('span', { class: 'status-pill', 'data-status': req.status }, `${STATUS[step].label} · ${step + 1}/5`),
      isMyTurn(req) && h('span', { class: 'mine' }, '내 차례'),
      h('span', { class: 'grow' }),
      !req.noLocation && h('button', { class: 'icon-btn', 'aria-label': '채팅에 공유', title: '채팅에 공유', onclick: () => sharePin(req) }, icon('send', 16)),
    ),

    h(
      'section',
      { class: 'sec' },
      h('h3', {}, '요청'),
      h('p', { class: 'quote' }, req.text),
      h('p', { class: 'quote-meta' }, `${PEOPLE.client.name} · ${req.time} · ${req.noLocation ? '채팅에서 등록 · 위치 없음' : `${SITE_LABEL[req.site]} ${pageLabel(req.path)}`}`),
      lost && !locked && renderLost(req),
      h(
        'div',
        { class: 'ai-box' },
        h('div', { class: 'ai-box-head' }, h('span', { class: 'ai-badge' }, 'AI'), '개발 요청으로 정리'),
        state.aiPending.has(req) ? h('div', {}, h('div', { class: 'skeleton' }), h('div', { class: 'skeleton short' })) : req.ai ? renderAiSummary(req.ai) : null,
      ),
    ),

    req.review && renderReviewNote(req),

    h(
      'section',
      { class: 'sec' },
      h('h3', {}, '대화 ', h('em', {}, talk)),
      req.replies.length
        ? h('div', { class: 'timeline' }, req.replies.map((item) => renderTimelineItem(item, req)))
        : h('p', { class: 'hint' }, req.noLocation ? '채팅에서 등록한 요청이라 답글 스레드가 없어요. 대화는 채팅에서 이어가요.' : '아직 대화가 없어요.'),
    ),

    h(
      'footer',
      { class: 'detail-foot' },
      renderActions(req),
      locked ? h('p', { class: 'readonly' }, icon('lock', 14), '해결된 요청은 읽기 전용이에요. 추가 수정은 새 핀으로 남겨 주세요.') : req.noLocation ? null : renderReply(req),
    ),
  );
}

// 사이트가 바뀌어 핀 자리를 못 찾았을 때
function renderLost(req) {
  const placing = state.placing?.type === 'relocate' && state.placing.id === req.id;
  return h(
    'div',
    { class: 'lost' },
    icon('alert', 16),
    h('span', {}, placing ? '사이트에서 새 위치를 눌러 주세요' : '이 화면에서 핀 자리를 찾지 못했어요'),
    placing
      ? h('button', { onclick: () => setMode('browse') }, '취소')
      : h('button', { onclick: () => startPlacing('relocate', req.id) }, '위치 다시 지정'),
  );
}

// 개발자가 검수 요청 때 남긴 반영 설명과 배포본 위치
function renderReviewNote(req) {
  const rv = req.review;
  const onB = state.site === 'B' && rv.pos.path === state.path;
  const pending = state.aiPending.has(rv);
  const open = state.aiOpen.has(rv);
  const toggle = () => {
    open ? state.aiOpen.delete(rv) : state.aiOpen.add(rv);
    render();
  };
  return h(
    'section',
    { class: 'sec review-sec' },
    h('h3', {}, '반영 내용'),
    h('p', { class: 'quote' }, rv.note),
    h('p', { class: 'quote-meta' }, `${PEOPLE.developer.name} · ${rv.time} · 배포본 ${pageLabel(rv.pos.path)} · ${areaLabel(rv.pos.respecId)}`),
    pending
      ? h('div', { class: 'ai-inline' }, h('span', { class: 'ai-badge' }, 'AI'), '쉬운 풀이를 만드는 중…')
      : rv.ai &&
          (open
            ? h('div', { class: 'ai-inline open' }, h('div', { class: 'ai-inline-head' }, h('span', { class: 'ai-badge' }, 'AI'), '쉬운 풀이', h('button', { onclick: toggle }, '접기')), h('p', {}, rv.ai))
            : h('button', { class: 'ai-inline', onclick: toggle }, h('span', { class: 'ai-badge' }, 'AI'), '쉬운 풀이 보기')),
    !onB &&
      h(
        'button',
        { class: 'see-review', onclick: () => goToReviewMark(req) },
        icon('pin', 15),
        deployment ? '배포본에서 반영 위치 보기' : '배포 주소가 연결되면 반영 위치를 볼 수 있어요',
      ),
  );
}

function goToReviewMark(req) {
  if (!deployment) return toast('아직 배포 주소가 연결되지 않았어요');
  state.scrollTarget = req.id;
  if (state.site !== 'B') switchSite('B', req.review.pos.path);
  else if (state.path !== req.review.pos.path) loadSite(req.review.pos.path);
  else scrollToPin(req);
}

// 대화 한 줄: 단계 변경은 가운데 작은 글씨, 말은 내 것 오른쪽 · 상대 것 왼쪽. 요청 상세에서는 내 답글을 고치거나 지울 수 있어요.
function renderTimelineItem(item, req) {
  if (item.event) return h('div', { class: 'event' }, `${PEOPLE[item.role].name} 님이 ${item.text} · ${item.time}`);
  const mine = item.role === currentRole;
  const p = PEOPLE[item.role];
  const pending = state.aiPending.has(item);
  const aiOpen = state.aiOpen.has(item);
  const aiLabel = item.role === 'developer' ? '쉬운 풀이' : '개발자용 정리';
  const editable = req && mine && !item.deleted && req.status !== 'done';
  const toggle = () => {
    aiOpen ? state.aiOpen.delete(item) : state.aiOpen.add(item);
    render();
  };

  let body;
  if (item.deleted) body = h('div', { class: 'bubble is-deleted' }, '삭제된 댓글입니다');
  else if (state.editing === item) body = renderEdit(item);
  else body = item.text && h('div', { class: 'bubble' }, item.text, item.edited && h('small', { class: 'edited' }, ' (수정됨)'));

  return h(
    'div',
    { class: `bubble-row${mine ? ' is-mine' : ''}` },
    !mine && avatar(item.role),
    h(
      'div',
      { class: 'bubble-col' },
      h('div', { class: 'who' }, mine ? item.time : h('span', {}, h('b', {}, p.name), ` ${p.label} · ${item.time}`)),
      body,
      !item.deleted && state.editing !== item &&
        (pending
          ? h('div', { class: 'ai-inline' }, h('span', { class: 'ai-badge' }, 'AI'), '정리하는 중…')
          : item.ai &&
              (aiOpen
                ? h('div', { class: 'ai-inline open' }, h('div', { class: 'ai-inline-head' }, h('span', { class: 'ai-badge' }, 'AI'), aiLabel, h('button', { onclick: toggle }, '접기')), h('p', {}, item.ai))
                : h('button', { class: 'ai-inline', onclick: toggle }, h('span', { class: 'ai-badge' }, 'AI'), `${aiLabel} 보기`))),
      editable && state.editing !== item &&
        (state.deleting === item
          ? h(
              'div',
              { class: 'bubble-tools confirm' },
              '삭제할까요?',
              h('button', { class: 'danger', onclick: () => { Object.assign(item, { deleted: true, ai: null }); state.deleting = null; toast('답글을 삭제했어요'); render(); } }, '삭제'),
              h('button', { onclick: () => { state.deleting = null; renderPanel(); } }, '취소'),
            )
          : h(
              'div',
              { class: 'bubble-tools' },
              h('button', { onclick: () => { state.editing = item; state.deleting = null; renderPanel(); } }, '수정'),
              h('button', { onclick: () => { state.deleting = item; state.editing = null; renderPanel(); } }, '삭제'),
            )),
    ),
  );
}

function renderEdit(item) {
  const input = h('textarea', { class: 'edit-input', rows: 2 });
  input.value = item.text;
  setTimeout(() => {
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }, 30);
  const save = () => {
    const text = input.value.trim();
    if (!text) return shake(input);
    state.editing = null;
    if (text === item.text) return renderPanel();
    Object.assign(item, { text, edited: true, ai: null });
    runAi(item, () => (item.role === 'developer' ? aiForDeveloper(text) : `고객 의견 정리: "${text}"`));
  };
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      save();
    }
    if (e.key === 'Escape') {
      state.editing = null;
      renderPanel();
    }
  });
  return h(
    'div',
    { class: 'edit-box' },
    input,
    h('div', { class: 'row' }, h('button', { class: 'btn btn-line btn-sm', onclick: () => { state.editing = null; renderPanel(); } }, '취소'), h('button', { class: 'btn btn-dark btn-sm', onclick: save }, '저장')),
  );
}

function shake(el) {
  el.classList.remove('is-error');
  void el.offsetWidth;
  el.classList.add('is-error');
  el.focus();
}

function renderReply(req) {
  const input = h('textarea', { placeholder: `${PEOPLE[currentRole].name}(으)로 답글 남기기 · Enter로 보내기`, rows: 1 });
  const submit = () => {
    const text = input.value.trim();
    if (!text) return shake(input);
    const reply = { role: currentRole, time: '방금 전', text, ai: null };
    req.replies.push(reply);
    runAi(reply, () => (currentRole === 'developer' ? aiForDeveloper(text) : `고객 의견 정리: "${text}"`));
    requestAnimationFrame(() => ($('#panelBody').scrollTop = $('#panelBody').scrollHeight));
  };
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      submit();
    }
  });
  return h('div', { class: 'reply' }, input, h('button', { class: 'send', 'aria-label': '답글 등록', onclick: submit }, icon('send', 16)));
}

// 역할과 단계에 맞는 결정 버튼
function renderActions(req) {
  const go = (status, label) => h('button', { class: 'btn btn-dark', onclick: (e) => changeStatus(req, status, e) }, label);
  if (req.status === 'done') return null;
  if (currentRole === 'developer') {
    if (req.status === 'working') return h('div', { class: 'decide' }, h('button', { class: 'btn btn-dark', onclick: () => openReview([req.id]) }, '검수 요청에 담기'));
    const next = DEV_NEXT[req.status];
    return next ? h('div', { class: 'decide' }, go(...next)) : h('p', { class: 'hint' }, '고객이 검수하고 있어요.');
  }
  if (req.status !== 'review') return h('p', { class: 'hint' }, '개발자가 작업하고 있어요. 궁금한 점은 답글로 남겨 주세요.');
  if (state.redo) {
    const input = h('textarea', { class: 'redo-input', placeholder: '어떤 점이 아직 아쉬운지 적어 주세요', rows: 2 });
    setTimeout(() => input.focus(), 30);
    const submit = () => {
      const reason = input.value.trim();
      if (!reason) return shake(input);
      req.replies.push({ role: 'client', time: '방금 전', text: `재수정 요청: ${reason}` });
      req.replies.push({ event: true, role: 'client', time: '방금 전', text: EVENT_TEXT.waiting });
      req.status = 'waiting';
      noticeStatus(req, 'waiting');
      state.redo = false;
      toast(`핀 ${req.no} 재수정을 요청했어요`);
      render();
    };
    return h(
      'div',
      { class: 'decide col' },
      input,
      h('div', { class: 'row' }, h('button', { class: 'btn btn-line', onclick: () => { state.redo = false; renderPanel(); } }, '취소'), h('button', { class: 'btn btn-dark', onclick: submit }, '재수정 요청 보내기')),
    );
  }
  return h(
    'div',
    { class: 'decide col' },
    state.site !== 'B' && req.review?.pos && h('p', { class: 'hint' }, '배포본에서 반영 위치를 확인하고 결정해 주세요.'),
    h('div', { class: 'row' }, h('button', { class: 'btn btn-line', onclick: () => { state.redo = true; renderPanel(); } }, '재수정 요청'), go('done', '승인하기')),
  );
}

function changeStatus(req, status, event) {
  req.status = status;
  req.replies.push({ event: true, role: currentRole, time: '방금 전', text: EVENT_TEXT[status] });
  noticeStatus(req, status);
  if (status === 'done') {
    confetti(event.clientX, event.clientY);
    toast(`핀 ${req.no}을 승인했어요`);
  } else {
    toast(`핀 ${req.no} · ${STATUS[STATUS_INDEX[status]].label}`);
  }
  render();
}

function renderNew() {
  const d = state.draft;
  const textarea = h('textarea', { placeholder: '어떤 점을 바꾸고 싶나요? 편하게 말로 적어 주세요.', rows: 5 });
  setTimeout(() => textarea.focus(), 50);
  const submit = () => {
    const text = textarea.value.trim();
    if (!text) return shake(textarea);
    const req = {
      id: 'r' + nextNo, no: nextNo++, site: state.site, path: d.path, selector: d.selector, respecId: d.respecId,
      rx: d.rx, ry: d.ry, pickText: d.pickText, status: 'waiting', time: '방금 전', text, ai: null, replies: [],
    };
    requests.unshift(req);
    if (state.connected && d.x != null) positions[req.id] = { x: d.x, y: d.y, found: true };
    state.draft = null;
    state.selected = req.id;
    runAi(req, () => aiForClient(req));
    noticeStatus(req, 'created');
    toast(`핀 ${req.no}을 남겼어요 · AI가 개발 요청으로 정리하고 있어요`);
  };
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
  });
  return h(
    'div',
    { class: 'new' },
    h('div', { class: 'detail-head' }, h('span', { class: 'pin-no lg' }, nextNo), h('div', { class: 'grow' }, h('h2', {}, '새 요청'), h('p', {}, `${SITE_LABEL[state.site]} · ${pageLabel(d.path)}${d.respecId ? ` · ${d.respecId}` : ''}`))),
    textarea,
    h('div', { class: 'examples' }, ['색을 바꾸고 싶어요', '글자가 잘 안 보여요', '더 크게 해 주세요'].map((ex) => h('button', { onclick: () => { textarea.value = ex; textarea.focus(); } }, ex))),
    h('div', { class: 'actions row' }, h('button', { class: 'btn btn-line', onclick: () => { state.draft = null; render(); } }, '취소'), h('button', { class: 'btn btn-dark', onclick: submit }, '요청 남기기')),
  );
}

// ─── 검수 요청 만들기 (개발자) ────────────────────────────
// 작업 중인 요청을 골라 요청마다 반영 설명을 쓰고, 배포본에서 고친 위치를 찍어 한 번에 보냅니다.
// 검수할 사이트는 처음 연결한 배포 주소로 고정입니다.
function openReview(preselect = []) {
  if (currentRole !== 'developer') return;
  if (!deployment) return openDeploy('검수 요청을 보내려면 먼저 배포 주소를 연결해 주세요.');
  const working = requests.filter((r) => r.status === 'working');
  state.review = { items: Object.fromEntries(working.map((r) => [r.id, { checked: preselect.includes(r.id), note: '', pos: null, err: null }])) };
  Object.assign(state, { selected: null, draft: null });
  if (state.site !== 'B') switchSite('B');
  else render();
}

function closeReview() {
  state.review = null;
  if (state.placing) setMode('browse');
  render();
}

function renderReview() {
  const items = requests.filter((r) => state.review.items[r.id]);
  const picked = items.filter((r) => state.review.items[r.id].checked);
  return h(
    'div',
    { class: 'review-view' },
    h(
      'header',
      { class: 'detail-top' },
      h('button', { class: 'back', onclick: closeReview, 'aria-label': '검수 요청 닫기' }, icon('left', 18)),
      h('h2', {}, '검수 요청'),
      h('span', { class: 'count-chip' }, `작업 중 ${items.length}`),
    ),
    h(
      'div',
      { class: 'review-site' },
      icon('link', 15),
      h('span', {}, '검수할 사이트'),
      h('b', {}, hostOf(deployment)),
      h('button', { onclick: () => openDeploy() }, '변경'),
    ),
    items.length
      ? h('div', { class: 'review-list' }, items.map(renderReviewItem))
      : h(
          'div',
          { class: 'review-empty' },
          h('b', {}, '작업 중인 요청이 없어요'),
          h('span', {}, '요청을 열어 "작업 시작"을 누르면 여기서 고를 수 있어요.'),
        ),
    h(
      'footer',
      { class: 'review-foot' },
      h('button', { class: 'btn btn-line', onclick: closeReview }, '취소'),
      h('button', { class: 'btn btn-dark', disabled: !picked.length, onclick: submitReview }, picked.length ? `${picked.length}건 검수 요청 보내기` : '보낼 요청을 골라 주세요'),
    ),
  );
}

function renderReviewItem(req) {
  const it = state.review.items[req.id];
  // 위치를 아직 안 찍은 카드 중 첫 번째만 보라 채움
  const firstMissing = requests.find((r) => state.review.items[r.id]?.checked && !state.review.items[r.id].pos);
  const placing = state.placing?.type === 'review' && state.placing.id === req.id;
  const note = h('textarea', { class: 'review-note', rows: 2, placeholder: '무엇을 어떻게 고쳤는지 적어 주세요', 'aria-label': `핀 ${req.no} 반영 설명` });
  note.value = it.note;
  note.addEventListener('input', () => {
    it.note = note.value;
    if (it.err && note.value.trim() && it.pos) {
      it.err = null;
      note.closest('.review-item').classList.remove('has-error');
    }
  });
  return h(
    'div',
    { class: `review-item${it.checked ? ' is-checked' : ''}${it.err ? ' has-error' : ''}` },
    h(
      'label',
      { class: 'review-head' },
      h('input', { type: 'checkbox', checked: it.checked, onchange: (e) => { it.checked = e.target.checked; it.err = null; renderPanel(); } }),
      h('span', { class: 'pin-no' }, req.no),
      h('span', { class: 'review-text' }, h('b', {}, req.text), h('small', {}, `${SITE_LABEL[req.site]} ${pageLabel(req.path)}`)),
    ),
    it.checked &&
      h(
        'div',
        { class: 'review-body' },
        note,
        it.pos
          ? h(
              'div',
              { class: 'review-pos is-set' },
              icon('pin', 15),
              h('span', {}, `배포본 ${pageLabel(it.pos.path)} · ${areaLabel(it.pos.respecId)}`),
              h('button', { onclick: () => startPlacing('review', req.id) }, placing ? '누르는 중…' : '다시 찍기'),
            )
          : h(
              'button',
              { class: `review-pos${placing ? ' is-placing' : firstMissing !== req && !state.placing ? ' is-next' : ''}`, onclick: () => (placing ? setMode('browse') : startPlacing('review', req.id)) },
              icon('pin', 15),
              placing ? '배포본에서 고친 곳을 눌러 주세요 · 다시 누르면 취소' : '배포본에서 반영 위치 찍기',
            ),
        it.err && h('p', { class: 'review-err' }, it.err),
      ),
  );
}

function submitReview() {
  const picked = requests.filter((r) => state.review.items[r.id]?.checked);
  if (!picked.length) return toast('보낼 요청을 골라 주세요');
  let missing = 0;
  picked.forEach((r) => {
    const it = state.review.items[r.id];
    it.err = !it.note.trim() ? '무엇을 고쳤는지 적어 주세요' : !it.pos ? '배포본에서 반영 위치를 찍어 주세요' : null;
    if (it.err) missing++;
  });
  if (missing) {
    renderPanel();
    $('#panelBody .has-error')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    return toast(`${missing}건에 빠진 내용이 있어요`);
  }
  if (state.placing) setMode('browse');
  picked.forEach((r) => {
    const it = state.review.items[r.id];
    r.status = 'review';
    r.review = { time: '방금 전', note: it.note.trim(), ai: null, pos: it.pos };
    r.replies.push({ event: true, role: 'developer', time: '방금 전', text: EVENT_TEXT.review });
  });
  notices.unshift({
    id: 'n' + Date.now(), to: 'client', req: picked[0].id, read: false,
    text: `박도윤 님이 검수를 요청했어요 · ${picked.length}건`,
    sub: `${picked.map((r) => `핀 ${r.no}`).join(', ')} · 방금 전`,
  });
  state.review = null;
  toast(`${picked.length}건 검수 요청을 보냈어요`);
  picked.forEach((r) => runAi(r.review, () => aiForDeveloper(r.review.note)));
}

// ─── 채팅 서랍 ──────────────────────────────────────────
function setChat(open) {
  state.chatOpen = open;
  $('#app').classList.toggle('chat-open', open);
  if (open) {
    renderChat();
    requestAnimationFrame(() => {
      $('#chatBody').scrollTop = $('#chatBody').scrollHeight;
      $('#chatInput').focus();
    });
  }
}

function renderChat() {
  $('#chatBody').replaceChildren(
    ...messages.map((m) => {
      if (m.type === 'system') return h('div', { class: 'system' }, m.text);
      const el = renderTimelineItem(m);
      const body = el.querySelector('.bubble-col');
      if (m.pin) {
        const req = findReq(m.pin);
        body.append(
          req
            ? h('button', { class: 'shared', onclick: () => { setChat(false); select(req.id); } }, h('span', { class: 'pin-no' }, req.no), h('span', {}, req.text))
            : h('div', { class: 'shared is-gone' }, '삭제된 핀이에요'),
        );
      }
      if (currentRole === 'client' && m.text) body.append(h('button', { class: 'to-request', onclick: () => addFromChat(m) }, '요청으로 등록'));
      return el;
    }),
  );
  if (!messages.length) $('#chatBody').append(h('p', { class: 'hint' }, '아직 대화가 없어요.'));
}

function sharePin(req) {
  messages.push({ role: currentRole, time: '방금 전', text: '', pin: req.id });
  setChat(true);
  toast(`핀 ${req.no}을 채팅에 공유했어요`);
  render();
}

function addFromChat(m) {
  const req = { id: 'r' + nextNo, no: nextNo++, site: state.site, path: state.path, selector: null, respecId: null, status: 'waiting', time: '방금 전', text: m.text, ai: null, replies: [], noLocation: true };
  requests.unshift(req);
  setChat(false);
  state.selected = req.id;
  runAi(req, () => `채팅에서 등록한 요청 (위치 없음)\n· 내용: "${m.text}"\n· 확인 필요: 관련 화면 위치를 핀으로 연결해 주세요`);
  noticeStatus(req, 'created');
  toast(`채팅을 요청 ${req.no}로 등록했어요`);
}

const chatInput = $('#chatInput');
chatInput.addEventListener('input', () => ($('#send').disabled = !chatInput.value.trim()));
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    sendChat();
  }
});
$('#send').addEventListener('click', sendChat);
function sendChat() {
  const text = chatInput.value.trim();
  if (!text) return;
  const m = { role: currentRole, time: '방금 전', text, ai: null };
  messages.push(m);
  chatInput.value = '';
  $('#send').disabled = true;
  runAi(m, () => (currentRole === 'developer' ? aiForDeveloper(text) : `고객 메시지 정리: "${text}"`));
  requestAnimationFrame(() => ($('#chatBody').scrollTop = $('#chatBody').scrollHeight));
}

// ─── 대화상자: 배포 연결 · 개발자 초대 ─────────────────────
let openModalEl = null;
function openModal(el, focus) {
  openModalEl = el;
  el.classList.add('open');
  el.setAttribute('aria-hidden', 'false');
  setTimeout(() => focus?.focus(), 50);
}
function closeModal() {
  if (!openModalEl) return;
  openModalEl.classList.remove('open');
  openModalEl.setAttribute('aria-hidden', 'true');
  openModalEl = null;
}
document.querySelectorAll('.modal-bg').forEach((bg) => bg.addEventListener('click', (e) => e.target === bg && closeModal()));

// 배포 주소: https만, 아이디·비밀번호가 든 주소는 거절, 경로는 빼고 origin만 저장 (백엔드 Deployment 검증과 같음)
function checkDeployUrl(value) {
  const v = value.trim();
  if (!v) return [null, '배포 주소를 입력해 주세요.'];
  if (/\s/.test(v)) return [null, '주소에 공백이 들어갈 수 없어요.'];
  let url;
  try {
    url = new URL(v);
  } catch {
    return [null, '주소 형식을 확인해 주세요. 예) https://my-shop.vercel.app'];
  }
  if (url.protocol !== 'https:') return [null, 'https:// 로 시작하는 주소만 연결할 수 있어요.'];
  if (url.username || url.password) return [null, '아이디·비밀번호가 들어간 주소는 쓸 수 없어요.'];
  return [url.origin, null];
}

function openDeploy(banner = '') {
  if (currentRole !== 'developer') return;
  $('#deployBanner').hidden = !banner;
  $('#deployBanner').textContent = banner;
  $('#deployInput').value = deployment || '';
  $('#deployInput').classList.remove('is-error');
  $('#deployError').textContent = '';
  $('#deployTitle').textContent = deployment ? '배포 주소 변경' : '배포 연결';
  $('#deploySave').textContent = deployment ? '변경하기' : '연결하기';
  openModal($('#deployModal'), $('#deployInput'));
}

$('#deployForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const raw = $('#deployInput').value;
  const [origin, error] = checkDeployUrl(raw);
  $('#deployError').textContent = error || '';
  $('#deployInput').classList.toggle('is-error', !!error);
  if (error) return $('#deployInput').focus();
  const trimmed = raw.trim().replace(/\/$/, '');
  if (origin === deployment) {
    closeModal();
    return toast('이미 연결된 주소예요');
  }
  deployment = origin;
  closeModal();
  toast(trimmed !== origin ? `경로는 빼고 ${hostOf(origin)}로 연결했어요` : `${hostOf(origin)}를 연결했어요`);
  switchSite('B');
});
$('#deployInput').addEventListener('input', () => {
  $('#deployError').textContent = '';
  $('#deployInput').classList.remove('is-error');
});
$('#deployCancel').addEventListener('click', closeModal);
$('#copyScript').addEventListener('click', () => copyText($('#scriptCode').textContent, '핀 스크립트를 복사했어요'));

function setInviteLink(on) {
  $('#inviteOn').hidden = !on;
  $('#inviteOff').hidden = on;
  $('#newLink').hidden = on;
}
$('#inviteBtn').addEventListener('click', () => openModal($('#inviteModal'), $('#copyLink')));
$('#copyLink').addEventListener('click', () => copyText($('#inviteLink').value, '초대 링크를 복사했어요'));
$('#disableLink').addEventListener('click', () => {
  setInviteLink(false);
  toast('초대 링크를 껐어요');
});
$('#newLink').addEventListener('click', () => {
  $('#inviteLink').value = `respec.app/invite/morrow-${Math.random().toString(36).slice(2, 8)}`;
  setInviteLink(true);
  toast('새 초대 링크를 만들었어요');
});
$('#inviteClose').addEventListener('click', closeModal);

// ─── 이벤트 연결 ────────────────────────────────────────
onSegment($('#modeSwitch'), setMode);
onSegment($('#deviceSwitch'), setDevice);
onSegment($('#roleSwitch'), (role) => {
  currentRole = role;
  Object.assign(state, { redo: false, editing: null, deleting: null });
  if (state.review) state.review = null;
  if (state.placing || state.mode === 'pin') setMode('browse');
  syncSegment($('#roleSwitch'), role);
  $('#meAvatar').dataset.role = role;
  $('#meAvatar').textContent = PEOPLE[role].initial;
  setConn();
  render();
});
$('#siteSelect').addEventListener('change', (e) => {
  const site = e.target.value;
  if (site === 'B' && !deployment) {
    e.target.value = state.site;
    refreshDropdowns();
    if (currentRole === 'developer') return openDeploy('배포 주소를 연결하면 배포본을 볼 수 있어요.');
    return toast('아직 개발자가 배포 주소를 연결하지 않았어요');
  }
  state.selected = null;
  switchSite(site);
  toast(site === 'A' ? '초안 A를 보고 있어요' : '배포본 B를 보고 있어요 · 검수 중인 요청은 반영 위치로 보여요');
});
$('#pageSelect').addEventListener('change', (e) => {
  if (!state.review) state.selected = null;
  loadSite(e.target.value);
});
$('#reload').addEventListener('click', () => loadSite(state.path));
$('#zoomIn').addEventListener('click', () => setZoom(state.zoom + 0.1));
$('#zoomOut').addEventListener('click', () => setZoom(state.zoom - 0.1));
$('#zoomFit').addEventListener('click', () => setZoom(1));
$('#navBack').addEventListener('click', () => goHistory(-1));
$('#navFwd').addEventListener('click', () => goHistory(1));
$('#fullBtn').addEventListener('click', () => setFull(!state.full));
$('#doneToggle').addEventListener('click', () => {
  state.showDone = !state.showDone;
  $('#doneToggle').setAttribute('aria-pressed', String(state.showDone));
  render();
});
$('#chatBtn').addEventListener('click', () => setChat(!state.chatOpen));
$('#chatClose').addEventListener('click', () => setChat(false));
$('#newRequest').addEventListener('click', () => {
  setMode('pin');
  if (state.mode === 'pin') toast('사이트에서 바꾸고 싶은 곳을 눌러 주세요');
});
$('#reviewBtn').addEventListener('click', () => openReview());
$('#deployChip').addEventListener('click', () => openDeploy());
$('#zipBtn').addEventListener('click', () => toast('초안 코드(ZIP)를 내려받았어요'));
$('#scriptGuideBtn').addEventListener('click', () => openDeploy('사이트 <head>에 핀 스크립트를 넣고 다시 배포하면 핀을 찍을 수 있어요.'));
$('#url').addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  try {
    const url = new URL(e.target.value);
    SITES[state.site] = url.origin;
    loadSite(url.pathname);
  } catch {
    toast('주소 형식을 확인해 주세요');
  }
});

document.addEventListener('keydown', (e) => {
  if (openModalEl) {
    if (e.key === 'Escape') closeModal();
    return;
  }
  if (e.target.closest('input, textarea, select')) {
    if (e.key === 'Escape') e.target.blur();
    return;
  }
  if (e.key === 'Escape') state.full ? setFull(false) : state.chatOpen ? setChat(false) : setMode('browse');
  const key = e.key.toLowerCase();
  if (key === 'v') setMode('browse');
  if (key === 'c') setMode('pin');
  if (key === 'f') setFull(!state.full);
});
window.addEventListener('resize', () => {
  syncSegment($('#deviceSwitch'), state.device);
  syncSegment($('#roleSwitch'), currentRole);
  syncSegment($('#modeSwitch'), state.mode);
});

// ─── 시작 ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  RESPEC.hydrate();
  enhanceSelect($('#siteSelect'));
  enhanceSelect($('#pageSelect'));
  syncSegment($('#roleSwitch'), currentRole);
  syncSegment($('#modeSwitch'), state.mode);
  $('#meAvatar').dataset.role = currentRole;
  $('#meAvatar').textContent = PEOPLE[currentRole].initial;
  setDevice('desktop');
  setZoom(1);
  // 요청 관리에서 들어오면: ?pin=r1 은 그 요청을, ?review=1(&pick=r1) 은 검수 요청 만들기를 엽니다.
  const target = findReq(params.get('pin'));
  if (params.get('review') && currentRole === 'developer') {
    const pick = params.get('pick');
    return openReview(pick ? [pick] : []);
  }
  if (target) {
    const prefer = ['review', 'done'].includes(target.status) && target.review?.pos && deployment ? 'B' : target.site;
    const p = posFor(target, prefer);
    state.site = prefer;
    state.selected = target.id;
    state.scrollTarget = p ? target.id : null;
    $('#siteSelect').value = prefer;
    return loadSite(p ? p.path : '/');
  }
  $('#siteSelect').value = state.site;
  loadSite('/');
});
