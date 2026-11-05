/** 사이트 안 이동 기록. 브라우저 뒤로/앞으로처럼 지금 위치(`index`) 앞뒤로 움직입니다. */
export interface SiteHistory {
  entries: string[];
  index: number;
}

export const EMPTY_SITE_HISTORY: SiteHistory = { entries: [], index: -1 };

/**
 * 사이트가 알려 준 경로를 기록합니다. 지금 위치와 같으면 그대로 두고(뒤로/앞으로로 도착한 경우),
 * 다르면 앞쪽 기록을 지우고 새로 쌓습니다.
 */
export const visitPath = (history: SiteHistory, path: string): SiteHistory => {
  if (history.entries[history.index] === path) return history;
  const entries = [...history.entries.slice(0, history.index + 1), path];
  return { entries, index: entries.length - 1 };
};

/** `step`만큼 옮긴 기록. 범위를 벗어나면 `null`입니다. */
export const moveHistory = (history: SiteHistory, step: number): SiteHistory | null => {
  const index = history.index + step;
  if (index < 0 || index >= history.entries.length) return null;
  return { ...history, index };
};

export const canMoveHistory = (history: SiteHistory, step: number) =>
  moveHistory(history, step) !== null;
