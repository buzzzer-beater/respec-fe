/** 작업 화면에서 보는 사이트. 초안은 AI가 만든 사이트, 배포본은 개발자가 연결한 사이트입니다. */
export type ViewerSite = 'draft' | 'deployed';

/** 고른 사이트를 담는 주소 쿼리 이름. 새로고침하거나 링크를 공유해도 같은 사이트를 봅니다. */
export const VIEWER_SITE_PARAM = 'site';

export interface ViewerSiteAvailability {
  hasDraft: boolean;
  hasDeployment: boolean;
}

/**
 * 볼 사이트를 정합니다. 고른 사이트가 있으면 그것을, 없거나 볼 수 없으면
 * 배포본을 먼저, 그다음 초안을 봅니다. 둘 다 없으면 `null`입니다.
 */
export const resolveViewerSite = (
  requested: string | null,
  { hasDraft, hasDeployment }: ViewerSiteAvailability,
): ViewerSite | null => {
  if (requested === 'draft' && hasDraft) return 'draft';
  if (requested === 'deployed' && hasDeployment) return 'deployed';
  if (hasDeployment) return 'deployed';
  if (hasDraft) return 'draft';
  return null;
};
