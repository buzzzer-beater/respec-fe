import { describe, expect, it } from 'vitest';

import { getPanelView, isWidePanelView } from './panel-view';

describe('getPanelView', () => {
  it('검수 요청 → 새 요청 → 상세 → 목록 순서로 고른다', () => {
    const all = { isReviewOpen: true, hasNewRequest: true, hasSelection: true };
    expect(getPanelView(all)).toBe('review');
    expect(getPanelView({ ...all, isReviewOpen: false })).toBe('new');
    expect(getPanelView({ ...all, isReviewOpen: false, hasNewRequest: false })).toBe('detail');
    expect(getPanelView({ isReviewOpen: false, hasNewRequest: false, hasSelection: false })).toBe(
      'list',
    );
  });

  it('상세와 검수 요청만 넓게 쓴다', () => {
    expect(isWidePanelView('detail')).toBe(true);
    expect(isWidePanelView('review')).toBe(true);
    expect(isWidePanelView('list')).toBe(false);
    expect(isWidePanelView('new')).toBe(false);
  });
});
