// RE:SPEC 작업 화면 — 사이트를 크게 보면서 이 페이지의 핀만 다룹니다. (공용 데이터: common.js)
// 기본값: 초안 A(morrow-a) = 5174, 배포본 B(morrow-b) = 5173. 다른 주소는 ?a=…&b=… 로 바꿀 수 있습니다.
const params = new URLSearchParams(location.search);
const SITES = {
  A: params.get('a') || 'http://localhost:5174',
  B: params.get('b') || 'http://localhost:5173',
};

// 작업판 위 사이트 프레임 크기
const state = {
  site: 'A', path: '/', device: 'desktop',
  mode: 'browse',
  connected: null, selected: null, draft: null,
  chatOpen: false, redo: false, scrollTarget: null, full: false,
  aiPending: new Set(), aiOpen: new Set(),
};
const positions = {}; // 핀 id → { x, y, found }
const isMyTurn = (req) => isMyTurnFor(req, currentRole);

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
function aiForClient(req) {
  const area = AREA[req.respecId] || (req.respecId?.startsWith('product-') ? `상품 카드(${req.respecId})` : '선택한 화면 요소');
  return `${area} 수정 요청\n· 고객 요청: "${req.text}"\n· 페이지: ${req.path}${req.pickText ? `\n· 선택한 글자: "${req.pickText}"` : ''}\n· 확인 필요: 구체적인 크기·색상 값은 대화로 정해요`;
}

// 개발자 말 속 전문 용어를 찾아 쉬운 풀이를 붙입니다. (시연용 예시 사전)
function runAi(target, make) {
  state.aiPending.add(target);
  render();
  setTimeout(() => {
    target.ai = make();
    state.aiPending.delete(target);
    render();
  }, 1200);
}

// ─── 전체 화면 ──────────────────────────────────────────
// 상단바와 패널을 숨기고 사이트를 실제 서비스 크기로 꽉 채워서 직접 써 봅니다. (F 또는 버튼, Esc로 나가기)
function setFull(on) {
  state.full = on;
  $('#app').classList.toggle('is-full', on);
  $('#fullLabel').textContent = on ? '전체 화면 나가기' : '전체 화면';
  $('#fullKey').textContent = on ? 'Esc' : 'F';
  if (on && !document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
  if (!on && document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  if (on && state.chatOpen) setChat(false);
  setTimeout(relocateSoon, 300);
}
// 브라우저의 Esc로 전체 화면이 풀리면 화면도 원래대로 돌립니다.
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && state.full) setFull(false);
});

// ─── 미리보기 화면 크기 ─────────────────────────────────
// 데스크톱은 가운데 영역을 꽉 채우고, 태블릿·모바일은 그 너비로 가운데에 놓습니다.
function setDevice(device) {
  state.device = device;
  syncSegment($('#deviceSwitch'), device);
  $('#browser').dataset.device = device;
  setTimeout(relocateSoon, 350);
}


// ─── 사이트 미리보기와 연결 코드 ─────────────────────────
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

frame.addEventListener('load', () => {
  clearTimeout(connectTimer);
  // 1.5초 안에 연결 코드가 위치를 알려오지 않으면 좌표 방식으로 바꿉니다.
  connectTimer = setTimeout(() => {
    if (state.connected) return;
    state.connected = false;
    setConn();
    renderPins();
  }, 1500);
});

function setConn() {
  const el = $('#conn');
  const map = { true: ['on', '연결 코드 연결됨'], false: ['off', '연결 코드 없음 · 좌표 모드'], null: ['wait', '연결 확인 중'] };
  const [s, label] = map[String(state.connected)];
  el.dataset.state = s;
  el.title = label;
  $('#app').classList.toggle('is-fallback', state.connected === false);
}

function send(message) {
  frame.contentWindow?.postMessage({ source: 'respec', ...message }, '*');
}

// 사이트가 그려지는 중이면 요소를 아직 못 찾으므로 몇 번 더 물어봅니다.
let relocateTimers = [];
function relocateSoon() {
  relocateTimers.forEach(clearTimeout);
  relocateTimers = [0, 300, 900, 1800].map((ms) => setTimeout(locateAll, ms));
}

function locateAll() {
  if (!state.connected) return;
  pagePins().forEach((req) => {
    if (!req.selector) return;
    const requestId = ++locateId;
    locateWaits[requestId] = req.id;
    send({ type: 'locate', requestId, selector: req.selector, relativeX: req.rx, relativeY: req.ry });
  });
}

window.addEventListener('message', (event) => {
  if (event.source !== frame.contentWindow) return;
  const data = event.data;
  if (!data || data.source !== 'respec-site') return;
  if (data.type === 'location') {
    const first = !state.connected;
    state.connected = true;
    if (data.path !== state.path) state.selected = null;
    state.path = data.path;
    $('#url').value = SITES[state.site].replace(/\/$/, '') + data.path;
    setConn();
    send({ type: 'pin-mode', enabled: state.mode === 'pin' });
    if (!first) state.draft = null;
    relocateSoon();
    const target = requests.find((r) => r.id === state.scrollTarget);
    if (target && target.path === data.path) {
      state.scrollTarget = null;
      // 사이트 화면이 그려질 시간을 조금 기다린 뒤 스크롤합니다.
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
    state.draft = { path: data.path, selector: data.selector, respecId: data.respecId, rx: data.relativeX, ry: data.relativeY, pickText: data.text };
    state.selected = null;
    const requestId = ++locateId;
    locateWaits[requestId] = 'draft';
    send({ type: 'locate', requestId, selector: data.selector, relativeX: data.relativeX, relativeY: data.relativeY });
    render();
  }
});

// 연결 코드가 없을 때: 핀 레이어를 직접 눌러 화면 좌표로 저장합니다. (확대 비율과 상관없이 비율로 계산)
$('#pinLayer').addEventListener('click', (event) => {
  if (state.connected !== false || state.mode !== 'pin' || event.target.closest('.pin')) return;
  const layer = $('#pinLayer');
  const rect = layer.getBoundingClientRect();
  const fx = (event.clientX - rect.left) / rect.width;
  const fy = (event.clientY - rect.top) / rect.height;
  state.draft = { path: state.path, selector: null, respecId: null, fx, fy, x: fx * layer.clientWidth, y: fy * layer.clientHeight };
  state.selected = null;
  if (state.full) setFull(false);
  render();
});

function pagePins() {
  return requests.filter((r) => r.site === state.site && r.path === state.path && !r.noLocation);
}

function pinPoint(req) {
  if (state.connected) {
    const pos = positions[req.id];
    return pos && pos.found ? pos : null;
  }
  if (state.connected === false && req.fx != null) {
    const layer = $('#pinLayer');
    return { x: req.fx * layer.clientWidth, y: req.fy * layer.clientHeight };
  }
  return null;
}

function renderPins() {
  const layer = $('#pinLayer');
  const keep = new Set();
  pagePins().forEach((req) => {
    const point = pinPoint(req);
    const important = state.selected === req.id || (req.status !== 'done' && isMyTurn(req));
    // 승인이 끝난 핀은 작업판에 표시하지 않습니다. (해결된 요청을 직접 열었을 때만 보여줌)
    if (!point || (req.status === 'done' && state.selected !== req.id)) return;
    keep.add(req.id);
    let pin = layer.querySelector(`[data-id="${req.id}"]`);
    if (!pin) {
      pin = h('button', { class: 'pin', 'data-id': req.id, 'aria-label': `핀 ${req.no}`, onclick: () => select(req.id, false) }, req.no);
      layer.append(pin);
    }
    pin.dataset.status = req.status;
    pin.classList.toggle('is-selected', state.selected === req.id);
    // 내 차례가 아니면 작은 점으로 줄이고, 마우스를 올리면 번호가 보입니다.
    pin.classList.toggle('is-quiet', !important);
    pin.style.left = point.x + 'px';
    pin.style.top = point.y + 'px';
  });
  layer.querySelectorAll('.pin:not(.is-draft)').forEach((pin) => {
    if (!keep.has(pin.dataset.id)) pin.remove();
  });
  layer.querySelector('.is-draft')?.remove();
  const d = state.draft;
  if (d && d.x != null) layer.append(h('span', { class: 'pin is-draft', style: `left:${d.x}px;top:${d.y}px` }, nextNo));
}

// ─── 모드 ───────────────────────────────────────────────
function setMode(mode) {
  state.mode = mode;
  const app = $('#app');
  app.classList.toggle('pin-mode', mode === 'pin');
  syncSegment($('#modeSwitch'), mode);
  send({ type: 'pin-mode', enabled: mode === 'pin' });
  if (mode !== 'pin' && state.draft) {
    state.draft = null;
    render();
  }
}

// 목록·지금 할 일에서 열면 사이트를 그 핀 위치로 스크롤합니다. (작업판의 핀을 직접 누를 때는 이미 보이므로 생략)
function scrollToPin(req) {
  if (req.selector) send({ type: 'scroll-to', selector: req.selector });
}

function select(id, scroll = true) {
  const req = requests.find((r) => r.id === id);
  if (!req) return;
  // 다른 페이지면 사이트가 열린 뒤(location 메시지) 스크롤합니다.
  state.scrollTarget = scroll && !req.noLocation ? req.id : null;
  if (scroll && state.connected && req.site === state.site && req.path === state.path) {
    scrollToPin(req);
    state.scrollTarget = null;
  }
  state.selected = id;
  state.draft = null;
  state.redo = false;
  if (req.site !== state.site) {
    state.site = req.site;
    $('#siteSelect').value = req.site;
    loadSite(req.path);
  } else if (req.path !== state.path && !req.noLocation) {
    loadSite(req.path);
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

// 상단바: 페이지 목록(핀 개수 포함), 내 차례 수, 채팅 수
function renderTop() {
  const paths = new Set(['/', state.path]);
  requests.filter((r) => r.site === state.site && !r.noLocation).forEach((r) => paths.add(r.path));
  const select = $('#pageSelect');
  select.replaceChildren(
    ...[...paths].map((p) => {
      const count = requests.filter((r) => r.site === state.site && r.path === p && r.status !== 'done').length;
      return h('option', { value: p, 'data-sub': count ? `핀 ${count}` : null }, pageLabel(p));
    }),
  );
  select.value = state.path;
  const mine = requests.filter(isMyTurn).length;
  $('#navCount').textContent = mine;
  $('#navCount').hidden = !mine;
  $('#chatCount').textContent = messages.filter((m) => m.type !== 'system').length;
  refreshDropdowns();
}

// ─── 오른쪽 패널: 이 페이지 핀 → 상세 ─────────────────────
function renderPanel() {
  const view = state.draft ? 'new' : state.selected ? 'detail' : 'list';
  $('#app').dataset.view = view;
  const body = $('#panelBody');
  const keep = view === 'list' ? body.scrollTop : 0;
  body.replaceChildren(view === 'new' ? renderNew() : view === 'detail' ? renderDetail() : renderList());
  body.scrollTop = keep;
}

// 오른쪽 패널: 지금 할 일 1개 + 이 페이지의 나머지 요청 한 줄씩. 해결된 요청은 요청 관리 화면에서 봅니다.
function renderList() {
  const open = pagePins().filter((r) => r.status !== 'done');
  const focus = open.find(isMyTurn);
  const rest = open.filter((r) => r !== focus);
  const elsewhere = requests.filter((r) => r.status !== 'done' && (r.site !== state.site || r.path !== state.path || r.noLocation)).length;
  return h(
    'div',
    { class: 'list-view' },
    h('h2', { class: 'panel-title' }, '이 페이지 요청 ', h('em', {}, open.length)),
    focus ? renderFocus(focus) : h('div', { class: 'calm' }, '지금은 상대 차례예요. 답이 오면 여기에 먼저 보여 드릴게요.'),
    rest.length > 0 && h('div', { class: 'rows' }, rest.map(renderItem)),
    elsewhere > 0 && h('a', { class: 'elsewhere', href: linkTo('requests.html') }, `다른 페이지 요청 ${elsewhere}개 보기`, icon('right', 14)),
  );
}

// 지금 할 일: 가장 먼저 처리할 요청 하나를 크게
function renderFocus(req) {
  const verb = currentRole === 'client' ? '결과를 확인하고 승인해 주세요' : DEV_NEXT[req.status][1];
  return h(
    'button',
    { class: 'focus', onclick: () => select(req.id) },
    h('span', { class: 'focus-label' }, '지금 할 일'),
    h('span', { class: 'focus-main' }, h('span', { class: 'pin-no' }, req.no), h('span', { class: 'focus-text' }, req.text)),
    h('span', { class: 'focus-foot' }, verb, icon('right', 16)),
  );
}

// 한 줄 요약: 번호 · 요청 첫 줄 · 단계
function renderItem(req) {
  return h(
    'button',
    { class: 'row-item', 'data-status': req.status, onclick: () => select(req.id) },
    h('span', { class: 'pin-no' }, req.no),
    h('span', { class: 'row-title' }, req.text),
    h('span', { class: 'row-status' }, STATUS[STATUS_INDEX[req.status]].label),
  );
}

// 단계가 바뀌면 대화 기록에 시간순으로 남깁니다.
const EVENT_TEXT = {
  checking: '요청을 확인하기 시작했어요',
  working: '수정 작업을 시작했어요',
  review: '수정을 마치고 검수를 요청했어요',
  done: '수정 결과를 승인했어요',
  waiting: '재수정을 요청했어요',
};

// AI 정리 글을 "제목 + 항목 목록"으로 나눠서 읽기 쉽게 보여줍니다.
function renderAiSummary(text) {
  const lines = text.split('\n').filter(Boolean);
  const title = lines[0].startsWith('·') ? null : lines.shift();
  return h(
    'div',
    { class: 'ai-summary' },
    title && h('b', {}, title),
    h('ul', {}, lines.map((line) => h('li', {}, line.replace(/^·\s*/, '')))),
  );
}

// 요청 상세: 요청 → AI 정리 → 대화. 섹션 사이는 회색 띠로 확실히 나눕니다.
function renderDetail() {
  const req = requests.find((r) => r.id === state.selected);
  const step = STATUS_INDEX[req.status];
  const point = req.site === state.site && req.path === state.path && state.connected && positions[req.id];
  const lost = point && !point.found;
  const talk = req.replies.filter((r) => !r.event).length;

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
    ),

    h(
      'section',
      { class: 'sec' },
      h('h3', {}, '요청'),
      h('p', { class: 'quote' }, req.text),
      h('p', { class: 'quote-meta' }, `${PEOPLE.client.name} · ${req.time} · ${req.noLocation ? '위치 없음' : pageLabel(req.path)}`, lost && h('span', { class: 'warn' }, ' · 위치 확인 필요')),
      h(
        'div',
        { class: 'ai-box' },
        h('div', { class: 'ai-box-head' }, h('span', { class: 'ai-badge' }, 'AI'), '개발 요청으로 정리'),
        state.aiPending.has(req) ? h('div', {}, h('div', { class: 'skeleton' }), h('div', { class: 'skeleton short' })) : req.ai ? renderAiSummary(req.ai) : null,
      ),
    ),

    h(
      'section',
      { class: 'sec' },
      h('h3', {}, '대화 ', h('em', {}, talk)),
      req.replies.length ? h('div', { class: 'timeline' }, req.replies.map(renderTimelineItem)) : h('p', { class: 'hint' }, '아직 대화가 없어요.'),
    ),

    h(
      'footer',
      { class: 'detail-foot' },
      renderActions(req),
      req.status === 'done' ? h('p', { class: 'readonly' }, icon('lock', 14), '해결된 요청은 읽기 전용이에요. 추가 수정은 새 핀으로 남겨 주세요.') : renderReply(req),
    ),
  );
}

// 대화 한 줄 (요청 상세 · 채팅 공통): 단계 변경은 가운데 작은 글씨로, 말은 내 것 오른쪽 · 상대 것 왼쪽
function renderTimelineItem(item) {
  if (item.event) return h('div', { class: 'event' }, `${PEOPLE[item.role].name} 님이 ${item.text} · ${item.time}`);
  const mine = item.role === currentRole;
  const p = PEOPLE[item.role];
  const pending = state.aiPending.has(item);
  const aiOpen = state.aiOpen.has(item);
  const aiLabel = item.role === 'developer' ? '쉬운 풀이' : '개발자용 정리';
  const toggle = () => {
    aiOpen ? state.aiOpen.delete(item) : state.aiOpen.add(item);
    render();
  };
  return h(
    'div',
    { class: `bubble-row${mine ? ' is-mine' : ''}` },
    !mine && avatar(item.role),
    h(
      'div',
      { class: 'bubble-col' },
      h('div', { class: 'who' }, mine ? item.time : h('span', {}, h('b', {}, p.name), ` ${p.label} · ${item.time}`)),
      h('div', { class: 'bubble' }, item.text),
      pending
        ? h('div', { class: 'ai-inline' }, h('span', { class: 'ai-badge' }, 'AI'), '정리하는 중…')
        : item.ai &&
            (aiOpen
              ? h('div', { class: 'ai-inline open' }, h('div', { class: 'ai-inline-head' }, h('span', { class: 'ai-badge' }, 'AI'), aiLabel, h('button', { onclick: toggle }, '접기')), h('p', {}, item.ai))
              : h('button', { class: 'ai-inline', onclick: toggle }, h('span', { class: 'ai-badge' }, 'AI'), `${aiLabel} 보기`)),
    ),
  );
}

function renderReply(req) {
  const input = h('textarea', { placeholder: `${PEOPLE[currentRole].name}(으)로 답글 남기기 · Enter로 보내기`, rows: 1 });
  const submit = () => {
    const text = input.value.trim();
    if (!text) return;
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
    const next = DEV_NEXT[req.status];
    return next ? h('div', { class: 'decide' }, go(...next)) : h('p', { class: 'hint' }, '고객이 검수하고 있어요.');
  }
  if (req.status !== 'review') return h('p', { class: 'hint' }, '개발자가 작업하고 있어요. 궁금한 점은 답글로 남겨 주세요.');
  if (state.redo) {
    const input = h('textarea', { class: 'redo-input', placeholder: '어떤 점이 아직 아쉬운지 적어 주세요 (필수)', rows: 2 });
    setTimeout(() => input.focus(), 30);
    const submit = () => {
      const reason = input.value.trim();
      if (!reason) {
        input.classList.remove('is-error');
        void input.offsetWidth;
        input.classList.add('is-error');
        return;
      }
      req.replies.push({ role: 'client', time: '방금 전', text: `재수정 요청: ${reason}` });
      req.replies.push({ event: true, role: 'client', time: '방금 전', text: EVENT_TEXT.waiting });
      req.status = 'waiting';
      noticeStatus(req, 'waiting');
      state.redo = false;
      toast(`핀 ${req.no} 재수정을 요청했어요`);
      render();
    };
    return h('div', { class: 'decide col' }, input, h('div', { class: 'row' }, h('button', { class: 'btn btn-line', onclick: () => { state.redo = false; renderPanel(); } }, '취소'), h('button', { class: 'btn btn-dark', onclick: submit }, '재수정 요청 보내기')));
  }
  return h('div', { class: 'decide' }, h('button', { class: 'btn btn-line', onclick: () => { state.redo = true; renderPanel(); } }, '재수정 요청'), go('done', '승인하기'));
}

function changeStatus(req, status, event) {
  req.status = status;
  req.replies.push({ event: true, role: currentRole, time: '방금 전', text: EVENT_TEXT[status] });
  noticeStatus(req, status);
  if (status === 'done') {
    confetti(event.clientX, event.clientY);
    toast(`핀 ${req.no}을 승인했어요`);
  } else if (status === 'review') {
    toast(`핀 ${req.no} 검수 요청을 보냈어요`);
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
    if (!text) {
      textarea.classList.remove('is-error');
      void textarea.offsetWidth;
      textarea.classList.add('is-error');
      return;
    }
    const req = {
      id: 'r' + nextNo, no: nextNo++, site: state.site, path: d.path, selector: d.selector, respecId: d.respecId,
      rx: d.rx, ry: d.ry, fx: d.fx, fy: d.fy, pickText: d.pickText, status: 'waiting', time: '방금 전', text, ai: null, replies: [],
    };
    requests.unshift(req);
    if (state.connected && d.x != null) positions[req.id] = { x: d.x, y: d.y, found: true };
    state.draft = null;
    state.selected = req.id;
    runAi(req, () => aiForClient(req));
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
    h('p', { class: 'hint' }, '등록하면 AI가 개발자가 이해하기 쉬운 요청으로 정리해요.'),
    h('div', { class: 'actions row' }, h('button', { class: 'btn btn-line', onclick: () => { state.draft = null; render(); } }, '취소'), h('button', { class: 'btn btn-dark', onclick: submit }, '요청 남기기')),
  );
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
      // 내가 쓴 메시지는 오른쪽, 상대 메시지는 왼쪽 말풍선
      const el = renderTimelineItem(m);
      const body = el.querySelector('.bubble-col');
      if (m.pin) {
        const req = requests.find((r) => r.id === m.pin);
        if (req) body.append(h('button', { class: 'shared', onclick: () => { setChat(false); select(req.id); } }, h('span', { class: 'pin-no' }, req.no), h('span', {}, req.text)));
      }
      body.append(h('button', { class: 'to-request', onclick: () => addFromChat(m) }, '요청으로 등록'));
      return el;
    }),
  );
}

// 채팅 내용을 위치 없는 요청으로 등록합니다.
function addFromChat(m) {
  const req = { id: 'r' + nextNo, no: nextNo++, site: state.site, path: state.path, selector: null, respecId: null, status: 'waiting', time: '방금 전', text: m.text, ai: null, replies: [], noLocation: true };
  requests.unshift(req);
  setChat(false);
  state.selected = req.id;
  runAi(req, () => `채팅에서 등록한 요청 (위치 없음)\n· 내용: "${m.text}"\n· 확인 필요: 관련 화면 위치를 핀으로 연결해 주세요`);
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

// ─── 이벤트 연결 ────────────────────────────────────────
onSegment($('#modeSwitch'), setMode);
onSegment($('#deviceSwitch'), setDevice);
onSegment($('#roleSwitch'), (role) => {
  currentRole = role;
  state.redo = false;
  syncSegment($('#roleSwitch'), role);
  $('#meAvatar').dataset.role = role;
  $('#meAvatar').textContent = PEOPLE[role].initial;
  render();
});
$('#siteSelect').addEventListener('change', (e) => {
  state.site = e.target.value;
  state.selected = null;
  loadSite('/');
  toast(state.site === 'A' ? '초안 A를 보고 있어요' : '배포본 B를 보고 있어요 · A의 핀은 B로 넘어가지 않아요');
});
$('#pageSelect').addEventListener('change', (e) => {
  state.selected = null;
  loadSite(e.target.value);
});
$('#reload').addEventListener('click', () => loadSite(state.path));
$('#fullBtn').addEventListener('click', () => setFull(!state.full));
$('#chatBtn').addEventListener('click', () => setChat(!state.chatOpen));
$('#chatClose').addEventListener('click', () => setChat(false));
$('#newRequest').addEventListener('click', () => {
  setMode('pin');
  toast('사이트에서 바꾸고 싶은 곳을 눌러 주세요');
});
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
  // 요청 관리 화면에서 카드를 눌러 들어오면(?pin=r1) 그 핀의 사이트·페이지로 바로 엽니다.
  const target = requests.find((r) => r.id === params.get('pin'));
  if (target) {
    state.site = target.site;
    state.selected = target.id;
    state.scrollTarget = target.noLocation ? null : target.id;
  }
  $('#siteSelect').value = state.site;
  setDevice('desktop');
  loadSite(target && !target.noLocation ? target.path : '/');
});
