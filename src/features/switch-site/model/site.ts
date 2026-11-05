import type { PinSource } from '@/entities/pin';

/** 작업 화면에서 보는 사이트. 초안(A)은 AI가 만든 사이트, 배포본(B)은 개발자가 연결한 사이트입니다. */
export type ViewerSite = 'draft' | 'deployed';

/** 고른 사이트를 담는 주소 쿼리 이름. 새로고침하거나 링크를 공유해도 같은 사이트를 봅니다. */
export const VIEWER_SITE_PARAM = 'site';

/** 사이트마다 보여 줄 핀의 `source`. 초안 핀은 초안에만, 배포본 핀은 배포본에만 그립니다. */
export const VIEWER_SITE_PIN_SOURCE: Record<ViewerSite, PinSource> = {
  draft: 'draft',
  deployed: 'deployment',
};

/** 사이트를 바꿨을 때 띄우는 안내 (demo-design `siteSelect` change) */
export const VIEWER_SITE_SWITCH_MESSAGE: Record<ViewerSite, string> = {
  draft: '초안 A를 보고 있어요',
  deployed: '배포본 B를 보고 있어요 · 검수 중인 요청은 반영 위치로 보여요',
};

/** 배포 전에 고객이 배포본을 고르면 띄우는 안내 */
export const DEPLOYMENT_NOT_CONNECTED_MESSAGE = '아직 개발자가 배포 주소를 연결하지 않았어요';

export interface ViewerSiteAvailability {
  hasDraft: boolean;
  hasDeployment: boolean;
}

/**
 * 볼 사이트를 정합니다. 고른 사이트가 있고 볼 수 있으면 그것을, 아니면 초안을 먼저(시안 기본값 A),
 * 초안이 없으면 배포본을 봅니다. 둘 다 없으면 `null`입니다.
 */
export const resolveViewerSite = (
  requested: string | null,
  { hasDraft, hasDeployment }: ViewerSiteAvailability,
): ViewerSite | null => {
  if (requested === 'draft' && hasDraft) return 'draft';
  if (requested === 'deployed' && hasDeployment) return 'deployed';
  if (hasDraft) return 'draft';
  if (hasDeployment) return 'deployed';
  return null;
};
