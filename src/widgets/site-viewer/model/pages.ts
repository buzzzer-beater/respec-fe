import type { SitePage, ViewerPin } from './types';

/**
 * 주소창 목록에 보여 줄 페이지와 페이지별 핀 수. `pins`는 지금 보는 사이트의 핀입니다.
 * 첫 화면(`/`)과 지금 페이지는 핀이 없어도 넣고, `/`가 먼저, 나머지는 경로 순서입니다.
 * 해결된 핀과 아직 보내지 않은 위치는 세지 않습니다(demo-design `renderTop`).
 */
export const toSitePages = (pins: readonly ViewerPin[], currentPath: string): SitePage[] => {
  const counts = new Map<string, number>([
    ['/', 0],
    [currentPath, 0],
  ]);
  for (const pin of pins) {
    const counted = pin.kind !== 'draft' && pin.status !== 'resolved';
    counts.set(pin.pagePath, (counts.get(pin.pagePath) ?? 0) + (counted ? 1 : 0));
  }
  return [...counts]
    .map(([path, pinCount]) => ({ path, pinCount }))
    .sort((a, b) => (a.path === '/' ? -1 : b.path === '/' ? 1 : a.path.localeCompare(b.path)));
};
