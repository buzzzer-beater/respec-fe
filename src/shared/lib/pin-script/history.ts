type HistoryMethod = 'pushState' | 'replaceState';

const METHODS: readonly HistoryMethod[] = ['pushState', 'replaceState'];

/** 핀의 `page_path`. 쿼리와 해시는 넣지 않습니다. */
export const getPagePath = (win: Window) => win.location.pathname || '/';

/**
 * 페이지 경로가 바뀌면 알려 줍니다. Next.js 같은 클라이언트 이동은 `pushState`라
 * 이벤트가 없으므로 `pushState`/`replaceState`를 감싸고 `popstate`를 듣습니다.
 * 같은 경로로의 `replaceState`(스크롤 위치 저장 등)는 무시합니다.
 */
export function watchPagePath(win: Window, onChange: (path: string) => void): () => void {
  const { history } = win;
  let current = getPagePath(win);

  const check = () => {
    const next = getPagePath(win);
    if (next === current) return;
    current = next;
    onChange(next);
  };

  const originals = METHODS.map((method) => {
    const original = history[method];
    const wrapped = function (this: History, ...args: Parameters<History[HistoryMethod]>) {
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
      // 다른 스크립트가 그 뒤에 또 감쌌으면 그대로 둡니다.
      if (history[method] === wrapped) history[method] = original;
    }
  };
}
