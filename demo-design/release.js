// 배포 주소 연결과 검수 요청을 보여 주는 시연 화면입니다. 데이터는 같은 탭의 sessionStorage에만 저장합니다.
const releaseState = { url: '', error: '', selected: new Set(), notes: {}, submitted: false };
let deployment = loadSaved('respec-deploy', null);
releaseState.url = deployment?.url || '';
const preselectedPin = new URLSearchParams(location.search).get('pin');
if (requests.some((req) => req.id === preselectedPin && req.status === 'working')) releaseState.selected.add(preselectedPin);

function validDeploymentUrl(value) {
  try {
    const url = new URL(value.trim());
    return ['http:', 'https:'].includes(url.protocol) && !!url.hostname && !url.username && !url.password;
  } catch {
    return false;
  }
}
function storeDeployment(data) {
  deployment = data;
  try { sessionStorage.setItem('respec-deploy', JSON.stringify(data)); } catch { /* 시연 화면은 계속 사용할 수 있습니다. */ }
}
function requestMeta(req) {
  return h('div', { class: 'request-meta' }, h('span', { class: 'number' }, req.no), h('span', {}, `${SITE_LABEL[req.site] || '사이트'} · ${req.noLocation ? '위치 없음' : pageLabel(req.path)}`));
}
function sectionHeading(no, title, description) {
  return h('div', { class: 'section-head' }, h('span', { class: 'step' }, no), h('div', {}, h('h3', {}, title), h('p', {}, description)));
}
function currentSite() {
  if (!deployment?.url || !validDeploymentUrl(deployment.url)) return null;
  return h('div', { class: 'saved-url' },
    h('span', { class: 'url-icon', html: RESPEC.icon('link', 17) }),
    h('div', { class: 'url-info' }, h('b', {}, '연결된 사이트'), h('a', { href: deployment.url, target: '_blank', rel: 'noopener noreferrer' }, deployment.url)),
    h('a', { class: 'open', href: deployment.url, target: '_blank', rel: 'noopener noreferrer' }, '사이트 열기 ↗'));
}
function saveUrl() {
  const url = releaseState.url.trim();
  if (!validDeploymentUrl(url)) {
    releaseState.error = 'http:// 또는 https://로 시작하는 올바른 사이트 주소를 입력해 주세요.';
    renderRelease();
    document.querySelector('#deploymentUrl')?.focus();
    return;
  }
  storeDeployment({ ...deployment, url });
  releaseState.error = '';
  renderRelease();
  toast('사이트 주소를 연결했어요');
}
function renderDeveloper() {
  const eligible = requests.filter((req) => req.status === 'working');
  const cardUrl = h('section', { class: 'card' }, sectionHeading('01', '수정한 사이트 연결', '수정한 사이트의 주소를 연결해 주세요.'),
    h('label', { class: 'label', for: 'deploymentUrl' }, '사이트 주소'),
    h('div', { class: 'url-row' },
      h('input', { class: 'text-input', id: 'deploymentUrl', type: 'url', placeholder: 'https://example.com', value: releaseState.url, 'aria-invalid': String(!!releaseState.error), oninput: (e) => { releaseState.url = e.target.value; } }),
      h('button', { class: 'btn btn-dark', type: 'button', onclick: saveUrl }, deployment?.url ? '주소 변경' : '주소 연결')),
    releaseState.error ? h('p', { class: 'error', role: 'alert' }, releaseState.error) : h('p', { class: 'helper' }, '고객이 열어 볼 수 있는 주소를 입력해 주세요.'),
    currentSite());

  const rows = eligible.map((req) => {
    const selected = releaseState.selected.has(req.id);
    const noteId = `note-${req.id}`;
    return h('div', { class: `request${selected ? ' is-selected' : ''}` },
      h('label', { class: 'request-label' },
        h('input', { type: 'checkbox', checked: selected, onchange: (e) => { e.target.checked ? releaseState.selected.add(req.id) : releaseState.selected.delete(req.id); renderRelease(); } }),
        h('span', { class: 'request-main' }, requestMeta(req), h('strong', {}, req.text))),
      selected && h('div', { class: 'request-note' }, h('label', { class: 'label', for: noteId }, '어떻게 수정했나요?'),
        h('textarea', { class: 'note-input', id: noteId, placeholder: '예: 버튼 크기를 키우고 휴대폰에서도 잘 보이도록 수정했어요.', 'aria-invalid': String(releaseState.submitted && !releaseState.notes[req.id]?.trim()), oninput: (e) => { releaseState.notes[req.id] = e.target.value; } }, releaseState.notes[req.id] || ''),
        releaseState.submitted && !releaseState.notes[req.id]?.trim() && h('p', { class: 'error' }, '수정한 내용을 입력해 주세요.')));
  });
  const cardRequests = h('section', { class: 'card' }, sectionHeading('02', '검수받을 요청 선택', '이번에 수정한 요청을 고르고 변경한 내용을 적어 주세요.'),
    h('div', { class: 'select-head' }, h('p', {}, `작업 중인 요청 ${eligible.length}개`), eligible.length > 0 && h('button', { class: 'select-all', type: 'button', onclick: () => { const all = eligible.every((req) => releaseState.selected.has(req.id)); eligible.forEach((req) => all ? releaseState.selected.delete(req.id) : releaseState.selected.add(req.id)); renderRelease(); } }, eligible.every((req) => releaseState.selected.has(req.id)) ? '전체 선택 해제' : '전체 선택')),
    h('div', { class: 'request-list' }, rows.length ? rows : h('div', { class: 'empty' }, '아직 작업 중인 요청이 없어요.', h('br'), h('a', { href: linkTo('requests.html') }, '요청 관리로 이동'))),
    releaseState.submitted && releaseState.selected.size === 0 && h('p', { class: 'error', role: 'alert' }, '검수받을 요청을 하나 이상 선택해 주세요.'),
    h('div', { class: 'submit-row' }, h('p', {}, `${releaseState.selected.size}개 선택 · 고객이 확인한 뒤 완료돼요`), h('button', { class: 'btn btn-dark', type: 'button', onclick: submitReview }, '검수 요청 보내기')));
  return [cardUrl, cardRequests];
}
function submitReview() {
  releaseState.submitted = true;
  if (!deployment?.url || !validDeploymentUrl(deployment.url)) { releaseState.error = '먼저 고객이 확인할 사이트 주소를 연결해 주세요.'; renderRelease(); document.querySelector('#deploymentUrl')?.focus(); return; }
  if (releaseState.url.trim() !== deployment.url) { releaseState.error = '바꾼 사이트 주소를 먼저 연결해 주세요.'; renderRelease(); document.querySelector('#deploymentUrl')?.focus(); return; }
  releaseState.error = '';
  const selected = requests.filter((req) => req.status === 'working' && releaseState.selected.has(req.id));
  if (!selected.length || selected.some((req) => !releaseState.notes[req.id]?.trim())) { renderRelease(); return; }
  selected.forEach((req) => {
    const note = releaseState.notes[req.id].trim();
    req.status = 'review';
    req.replies ||= [];
    req.replies.push({ role: 'developer', time: '방금 전', text: note });
    req.replies.push({ event: true, role: 'developer', time: '방금 전', text: '수정을 마치고 검수를 요청했어요' });
    noticeStatus(req, 'review');
  });
  const previousItems = (deployment?.items || []).filter((item) => !selected.some((req) => req.id === item.reqId));
  storeDeployment({ ...deployment, submittedAt: new Date().toISOString(), items: [...previousItems, ...selected.map((req) => ({ reqId: req.id, note: releaseState.notes[req.id].trim() }))] });
  releaseState.selected.clear(); releaseState.notes = {}; releaseState.submitted = false; releaseState.error = '';
  saveData(); renderRelease(); toast(`${selected.length}개 요청을 고객에게 보냈어요`);
}
function renderCustomer() {
  const pending = requests.filter((req) => req.status === 'review');
  const site = h('section', { class: 'card' }, sectionHeading('01', '수정된 사이트', '개발자가 연결한 사이트를 직접 확인해 보세요.'),
    currentSite() || h('div', { class: 'empty' }, '아직 연결된 사이트가 없어요. 개발자가 주소를 연결하면 여기에 표시됩니다.'));
  const review = h('section', { class: 'card' }, sectionHeading('02', '확인이 필요한 요청', '요청을 열어 수정된 내용을 확인하고 승인하거나 재수정을 요청해 주세요.'),
    h('div', { class: 'review-list' }, pending.length ? pending.map((req) => {
      const note = deployment?.items?.find((item) => item.reqId === req.id)?.note;
      return h('a', { class: 'review-item', href: linkTo('workspace.html', { pin: req.id }) }, requestMeta(req), h('strong', {}, req.text), note && h('div', { class: 'note' }, h('b', {}, '개발자의 수정 내용'), h('div', {}, note)), h('span', { class: 'hint' }, '작업 화면에서 확인하기 →'));
    }) : h('div', { class: 'empty' }, '지금 확인할 요청이 없어요.')));
  return [site, review];
}
function renderRelease() {
  const developer = currentRole === 'developer';
  $('#pageTitle').textContent = developer ? '수정한 내용을 전달해요' : '수정된 내용을 확인해요';
  $('#pageDescription').textContent = developer ? '사이트 주소와 수정한 요청을 고객에게 함께 보내세요.' : '개발자가 수정한 사이트와 요청을 확인할 수 있어요.';
  $('#content').replaceChildren(...(developer ? renderDeveloper() : renderCustomer()));
  $('#guide').replaceChildren(
    h('div', { class: 'side-heading' }, icon('check', 18), h('h3', {}, developer ? '이렇게 진행돼요' : '확인하는 방법')),
    h('ol', {},
      h('li', {}, h('span', { class: 'num' }, '1'), h('span', {}, h('b', {}, developer ? '사이트 주소 연결' : '수정된 사이트 열기'), developer ? '고객이 확인할 수 있는 주소를 입력해요.' : '개발자가 연결한 사이트를 직접 사용해 봐요.')),
      h('li', {}, h('span', { class: 'num' }, '2'), h('span', {}, h('b', {}, developer ? '수정한 요청 선택' : '요청별 수정 내용 확인'), developer ? '작업을 마친 요청과 수정 내용을 함께 보내요.' : '각 요청을 열어 변경된 내용을 살펴봐요.')),
      h('li', {}, h('span', { class: 'num' }, '3'), h('span', {}, h('b', {}, '고객 확인 후 완료'), developer ? '고객이 승인하면 요청이 해결돼요.' : '만족하면 승인하고, 부족하면 재수정을 요청해요.'))));
  syncSegment($('#roleSwitch'), currentRole);
  $('#meAvatar').dataset.role = currentRole; $('#meAvatar').textContent = PEOPLE[currentRole].initial;
  refreshBell();
}
onSegment($('#roleSwitch'), (role) => { currentRole = role; releaseState.error = ''; releaseState.submitted = false; saveData(); renderRelease(); });
document.addEventListener('DOMContentLoaded', () => {
  RESPEC.hydrate();
  $('#toWorkspace').href = linkTo('workspace.html'); $('#backLink').href = linkTo('workspace.html');
  $('#toRequests').href = linkTo('requests.html'); $('#toProjects').href = linkTo('projects.html');
  renderRelease();
});
