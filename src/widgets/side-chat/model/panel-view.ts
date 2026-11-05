import type { PanelView } from './types';

/**
 * 오른쪽 패널에 보여 줄 화면. 검수 요청 → 새 요청 → 요청 상세 → 목록 순서로 앞선 것을 보여 줍니다.
 * (demo-design `renderPanel`) 패널과 배치(`WorkspaceLayout`의 폭)가 같은 기준을 씁니다.
 */
export const getPanelView = ({
  isReviewOpen,
  hasNewRequest,
  hasSelection,
}: {
  isReviewOpen: boolean;
  hasNewRequest: boolean;
  hasSelection: boolean;
}): PanelView =>
  isReviewOpen ? 'review' : hasNewRequest ? 'new' : hasSelection ? 'detail' : 'list';

/** 상세와 검수 요청은 내용이 많아 패널을 넓힙니다(420 → 560px). */
export const isWidePanelView = (view: PanelView) => view === 'detail' || view === 'review';
