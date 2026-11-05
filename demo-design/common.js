// RE:SPEC 공용 데이터와 도우미 — 작업 화면(workspace)과 요청 관리 화면(requests)이 함께 씁니다.

const STATUS = [
  { key: 'waiting', label: '요청 대기' },
  { key: 'checking', label: '확인 중' },
  { key: 'working', label: '작업 중' },
  { key: 'review', label: '검수 대기' },
  { key: 'done', label: '해결됨' },
];
const STATUS_INDEX = Object.fromEntries(STATUS.map((s, i) => [s.key, i]));
const PEOPLE = {
  client: { name: '김하늘', initial: '김', label: '고객' },
  developer: { name: '박도윤', initial: '박', label: '개발자' },
};
const SITE_LABEL = { A: '초안 A', B: '배포본 B' };

function pageLabel(path) {
  if (path === '/') return '메인';
  if (path.startsWith('/products/')) return '상품 상세';
  return path;
}

// 개발자는 대기·확인·작업 단계, 고객은 검수 단계에서 다음 행동을 합니다.
function isMyTurnFor(req, role) {
  return role === 'developer' ? ['waiting', 'checking', 'working'].includes(req.status) : req.status === 'review';
}

// 역할과 단계에 맞는 다음 단계 (개발자 버튼용)
const DEV_NEXT = { waiting: ['checking', '확인 시작'], checking: ['working', '작업 시작'], working: ['review', '검수 요청 보내기'] };

// ─── 시연용 예시 데이터 ──────────────────────────────────
const DEFAULT_REQUESTS = [
  {
    id: 'r1', no: 1, site: 'A', path: '/', selector: '[data-respec-id="hero"]', respecId: 'hero',
    rx: 0.5, ry: 0.45, fx: 0.5, fy: 0.35, status: 'working', time: '12분 전',
    text: '첫 화면이 너무 흔해요. 우리 브랜드처럼 깔끔하고 세련된 느낌이면 좋겠어요. 색은 흰색이랑 검은색으로 차분하게요.',
    ai: '메인 배너(hero) 리디자인\n· 색상: 흰색 배경 + 검정 포인트 (무채색)\n· 톤: 미니멀하고 차분하게, 브랜드 로고 강조\n· 확인 필요: 사진 교체 여부, 버튼 문구',
    replies: [{ role: 'developer', time: '4분 전', text: 'hero 섹션 컬러 토큰을 무채색으로 교체하고 워드마크를 확대하는 중입니다.', ai: '· 섹션: 페이지 안의 한 구역\n· 토큰: 미리 정해 둔 색·크기 값\n· 워드마크: 글자로 된 로고' }],
  },
  {
    id: 'r2', no: 2, site: 'A', path: '/', selector: '[data-respec-id="catalog"]', respecId: 'catalog',
    rx: 0.5, ry: 0.06, fx: 0.3, fy: 0.82, status: 'checking', time: '48분 전',
    text: '신발 종류별로 골라볼 수 있으면 좋겠어요. 지금은 찾기 힘들어요.',
    ai: '상품 목록 카테고리 필터 추가\n· 항목: 전체 / 레더 / 스웨이드 / 고어텍스\n· 선택한 필터 강조 표시\n· 확인 필요: 정렬(가격순 등) 포함 여부',
    replies: [{ role: 'developer', time: '40분 전', text: '필터 상태를 URL 쿼리로 유지할지 확인하고 있습니다.', ai: '· 쿼리: 주소 뒤에 붙는 설정 값 — 고른 필터가 새로고침해도 남게 할지 확인 중이에요.' }],
  },
  {
    id: 'r3', no: 3, site: 'A', path: '/products/af1-white-navy', selector: '[data-respec-id="add-to-cart"]', respecId: 'add-to-cart',
    rx: 0.5, ry: 0.5, fx: 0.62, fy: 0.62, status: 'waiting', time: '1시간 전',
    text: '폰으로 보니까 장바구니 버튼이 너무 작아서 누르기 힘들어요.',
    ai: '모바일 상세 페이지 장바구니 버튼 개선\n· 대상: 640px 이하 화면의 add-to-cart 버튼\n· 버튼 높이 52px 이상, 화면 아래 고정 검토\n· 확인 필요: 가격을 버튼 옆에 함께 보여줄지',
    replies: [],
  },
  {
    id: 'r4', no: 4, site: 'A', path: '/', selector: '[data-respec-id="product-af1-strap-black"]', respecId: 'product-af1-strap-black',
    rx: 0.8, ry: 0.12, fx: 0.55, fy: 0.9, status: 'review', time: '2시간 전',
    text: 'HOT 표시가 모든 상품에 붙어 있어서 정신없어요.',
    ai: '상품 카드 배지 정리\n· 모든 카드의 HOT 배지 → 인기 상품에만 표시\n· 확인 필요: 인기 기준(판매량·리뷰 수)',
    replies: [{ role: 'developer', time: '32분 전', text: '배지 노출 조건을 리뷰 수 상위 2개로 제한했습니다. 확인 부탁드립니다.', ai: '리뷰가 많은 상품 2개에만 HOT 표시가 붙도록 바꿨어요.' }],
  },
  {
    id: 'r5', no: 5, site: 'A', path: '/', selector: '[data-respec-id="header"]', respecId: 'header',
    rx: 0.92, ry: 0.5, fx: 0.9, fy: 0.04, status: 'done', time: '어제',
    text: '장바구니 글자가 잘 안 보여요.',
    ai: '헤더 장바구니 텍스트 대비 개선\n· 글자 크기 14px 이상, 배경 대비 4.5:1 이상',
    replies: [{ role: 'developer', time: '어제', text: '대비를 높이고 굵기를 600으로 수정했습니다.', ai: '글자를 더 진하고 굵게 바꿨어요.' }],
  },
];

const DEFAULT_MESSAGES = [
  { type: 'system', text: '박도윤 님이 개발자로 참여했어요' },
  { role: 'client', time: '1시간 전', text: '안녕하세요! 초안 보고 핀으로 몇 군데 남겨 뒀어요.' },
  { role: 'developer', time: '52분 전', text: '확인했습니다. 반응형 브레이크포인트 기준으로 모바일 이슈부터 볼게요.', ai: '· 반응형: 휴대폰·PC 크기에 맞춰 화면이 바뀌는 방식\n· 브레이크포인트: 화면 크기에 따라 모양이 바뀌는 기준' },
  { role: 'client', time: '45분 전', text: '이것도 같이 봐 주세요!', pin: 'r2' },
  { role: 'developer', time: '30분 전', text: 'HOT 배지 수정 배포했고 검수 요청 드렸습니다.', ai: '· 배포: 수정한 사이트를 실제 주소에 올리는 일' },
];

// 개발자 설명 속 어려운 말을 풀어 주는 시연용 AI
const GLOSSARY = {
  컴포넌트: '화면을 이루는 작은 조각',
  토큰: '미리 정해 둔 색·크기 값',
  쿼리: '주소 뒤에 붙는 설정 값',
  브레이크포인트: '화면 크기에 따라 모양이 바뀌는 기준',
  반응형: '휴대폰·PC 크기에 맞춰 화면이 바뀌는 방식',
  배포: '수정한 사이트를 실제 주소에 올리는 일',
  섹션: '페이지 안의 한 구역',
  워드마크: '글자로 된 로고',
};
function aiForDeveloper(text) {
  const terms = Object.keys(GLOSSARY).filter((word) => text.includes(word));
  if (!terms.length) return '어려운 용어 없이 바로 이해할 수 있는 설명이에요.';
  return terms.map((word) => `· ${word}: ${GLOSSARY[word]}`).join('\n');
}


// 알림: 상대가 내 차례를 만들었을 때 상단바 종에 쌓입니다. to = 받는 역할
const DEFAULT_NOTICES = [
  { id: 'n1', to: 'client', req: 'r4', text: '박도윤 님이 핀 4 검수를 요청했어요', sub: 'HOT 배지 정리 · 32분 전', read: false },
  { id: 'n2', to: 'developer', req: 'r3', text: '김하늘 님이 새 요청을 남겼어요', sub: '핀 3 · 장바구니 버튼 · 1시간 전', read: false },
  { id: 'n3', to: 'client', req: 'r1', text: '박도윤 님이 핀 1 작업을 시작했어요', sub: '메인 배너 · 12분 전', read: true },
];
const NOTICE_TEXT = {
  review: (req) => [`박도윤 님이 핀 ${req.no} 검수를 요청했어요`, 'client'],
  waiting: (req) => [`김하늘 님이 핀 ${req.no} 재수정을 요청했어요`, 'developer'],
  done: (req) => [`김하늘 님이 핀 ${req.no}을 승인했어요`, 'developer'],
  working: (req) => [`박도윤 님이 핀 ${req.no} 작업을 시작했어요`, 'client'],
};

function noticeStatus(req, status) {
  const make = NOTICE_TEXT[status];
  if (!make) return;
  const [text, to] = make(req);
  notices.unshift({ id: 'n' + Date.now() + req.id, to, req: req.id, text, sub: `${req.text.slice(0, 18)}… · 방금 전`, read: false });
}

// 같은 탭에서 작업 화면 ↔ 요청 관리를 오가도 남긴 핀과 상태가 유지되도록 세션에 저장합니다.
// 저장소를 쓸 수 없으면 예시 데이터로 시작합니다.
function loadSaved(key, fallback) {
  try {
    const saved = sessionStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}
function saveData() {
  try {
    sessionStorage.setItem('respec-requests', JSON.stringify(requests));
    sessionStorage.setItem('respec-messages', JSON.stringify(messages));
    sessionStorage.setItem('respec-role', JSON.stringify(currentRole));
    sessionStorage.setItem('respec-notices', JSON.stringify(notices));
  } catch {
    // 저장하지 못해도 화면은 그대로 동작합니다.
  }
  // 화면마다 render() 끝에 saveData()를 부르므로, 역할이 바뀌면 종도 여기서 함께 다시 그립니다.
  refreshBell();
}
function resetDemo() {
  try {
    ['respec-requests', 'respec-messages', 'respec-role', 'respec-notices', 'respec-invite-studio'].forEach((k) => sessionStorage.removeItem(k));
  } catch {
    // 무시
  }
  location.reload();
}

const requests = loadSaved('respec-requests', structuredClone(DEFAULT_REQUESTS));
const messages = loadSaved('respec-messages', structuredClone(DEFAULT_MESSAGES));
let currentRole = loadSaved('respec-role', 'client');
const notices = loadSaved('respec-notices', structuredClone(DEFAULT_NOTICES));
let nextNo = Math.max(0, ...requests.map((r) => r.no)) + 1;

// 화면 사이를 이동할 때 시연 사이트 주소(?a=&b=)를 그대로 넘깁니다.
function linkTo(page, extra = {}) {
  const params = new URLSearchParams(location.search);
  params.delete('pin');
  Object.entries(extra).forEach(([k, v]) => params.set(k, v));
  const query = params.toString();
  return page + (query ? '?' + query : '');
}

// ─── DOM 도우미 ─────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
// 사용자가 입력한 글은 항상 텍스트 노드로만 넣습니다. html 속성은 고정된 아이콘 문자열에만 씁니다.
function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style') el.style.cssText = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}
const icon = (name, size) => h('span', { class: 'i', html: RESPEC.icon(name, size) });
const avatar = (role) => h('span', { class: 'avatar', 'data-role': role }, PEOPLE[role].initial);

let toastTimer;
function toast(text) {
  const el = $('#toast');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

// 선택된 버튼 아래로 흰 바탕이 미끄러지는 세그먼트
function syncSegment(group, value) {
  const buttons = [...group.querySelectorAll('button')];
  buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === value)));
  const active = buttons.find((b) => b.dataset.value === value);
  const thumb = group.querySelector('.thumb');
  if (!thumb || !active) return;
  thumb.style.width = active.offsetWidth + 'px';
  thumb.style.transform = `translateX(${active.offsetLeft}px)`;
}

function onSegment(group, handler) {
  group.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) handler(b.dataset.value);
  });
}

// ─── 드롭다운: 브라우저 기본 메뉴 대신 디자인한 메뉴를 띄웁니다. ───────
// 실제 값은 숨겨 둔 <select>가 그대로 들고 있어서, 기존 change 이벤트 코드를 바꿀 필요가 없습니다.
// <option data-sub="핀 3">처럼 보조 정보를 넣으면 메뉴 오른쪽에 함께 보입니다.
const dropdownRefreshers = [];

function enhanceSelect(select) {
  const wrap = select.closest('.select');
  wrap.classList.add('is-enhanced');
  const trigger = h('button', { type: 'button', class: 'dd-trigger', 'aria-haspopup': 'listbox', 'aria-expanded': 'false', 'aria-label': select.getAttribute('aria-label') });
  const menu = h('div', { class: 'dd-menu', role: 'listbox', hidden: true });
  wrap.append(trigger, menu);

  const refresh = () => {
    const opt = select.selectedOptions[0];
    // 보조 정보가 없는 항목도 있으므로 빈 값은 빼고 넣습니다.
    trigger.replaceChildren(...[h('span', { class: 'dd-value' }, opt?.textContent || ''), opt?.dataset.sub && h('span', { class: 'dd-sub' }, opt.dataset.sub), icon('down', 14)].filter(Boolean));
  };
  const close = () => {
    if (menu.hidden) return;
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    wrap.classList.remove('is-open');
  };
  const choose = (value) => {
    close();
    if (select.value !== value) {
      select.value = value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    refresh();
    trigger.focus();
  };
  const open = () => {
    menu.replaceChildren(
      ...[...select.options].map((o) => {
        const selected = o.value === select.value;
        return h(
          'button',
          { type: 'button', class: 'dd-item', role: 'option', 'aria-selected': String(selected), onclick: () => choose(o.value) },
          h('span', { class: 'dd-check' }, selected ? icon('check', 15) : null),
          h('span', { class: 'dd-label' }, o.textContent),
          o.dataset.sub && h('span', { class: 'dd-sub' }, o.dataset.sub),
        );
      }),
    );
    menu.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    wrap.classList.add('is-open');
    (menu.querySelector('[aria-selected="true"]') || menu.firstChild)?.focus();
  };

  trigger.addEventListener('click', () => (menu.hidden ? open() : close()));
  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      open();
    }
  });
  menu.addEventListener('keydown', (e) => {
    const items = [...menu.querySelectorAll('.dd-item')];
    const i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') items[(i + 1) % items.length].focus();
    if (e.key === 'ArrowUp') items[(i - 1 + items.length) % items.length].focus();
    if (e.key === 'Escape') {
      close();
      trigger.focus();
    }
    if (['ArrowDown', 'ArrowUp', 'Escape'].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
    }
  });
  document.addEventListener('pointerdown', (e) => {
    if (!wrap.contains(e.target)) close();
  });
  // 사이트 미리보기(iframe)를 누르면 창 포커스가 빠지므로 그때도 닫습니다.
  window.addEventListener('blur', close);

  dropdownRefreshers.push(refresh);
  refresh();
}

function refreshDropdowns() {
  dropdownRefreshers.forEach((refresh) => refresh());
}

// ─── 알림 종: 상단바 오른쪽(.topbar-right)이 있는 화면에 자동으로 붙습니다. ──────
let bell = null;

function mountBell() {
  const right = document.querySelector('.topbar-right');
  if (!right || bell) return;
  const button = h('button', { class: 'icon-btn bell-btn', 'aria-label': '알림', 'aria-expanded': 'false', html: RESPEC.icon('bell', 19) });
  const badge = h('span', { class: 'badge', hidden: true });
  const menu = h('div', { class: 'bell-menu', role: 'dialog', 'aria-label': '알림', hidden: true });
  const wrap = h('div', { class: 'bell' }, button, badge, menu);
  right.insertBefore(wrap, right.querySelector('.me'));
  bell = { wrap, button, badge, menu };

  const setOpen = (open) => {
    menu.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
  };
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(menu.hidden);
  });
  document.addEventListener('click', (e) => !wrap.contains(e.target) && setOpen(false));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && setOpen(false));
  refreshBell();
}

function refreshBell() {
  if (!bell) return;
  const mine = notices.filter((n) => n.to === currentRole);
  const unread = mine.filter((n) => !n.read).length;
  bell.badge.textContent = unread;
  bell.badge.hidden = !unread;
  bell.menu.replaceChildren(
    h(
      'div',
      { class: 'bell-head' },
      h('b', {}, '알림'),
      unread > 0 && h('button', { onclick: () => { mine.forEach((n) => (n.read = true)); saveData(); } }, '모두 읽음'),
    ),
    mine.length
      ? h(
          'ul',
          { class: 'bell-list' },
          mine.map((n) =>
            h(
              'li',
              {},
              h(
                'a',
                {
                  class: `bell-item${n.read ? '' : ' is-new'}`,
                  href: linkTo('workspace.html', { pin: n.req }),
                  onclick: () => {
                    n.read = true;
                    saveData();
                  },
                },
                h('span', { class: 'bell-dot' }),
                h('span', {}, h('b', {}, n.text), h('small', {}, n.sub)),
              ),
            ),
          ),
        )
      : h('p', { class: 'bell-empty' }, '새 알림이 없어요'),
  );
}

document.addEventListener('DOMContentLoaded', mountBell);
