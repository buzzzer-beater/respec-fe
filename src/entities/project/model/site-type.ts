/** 초안 사이트 유형. 백엔드는 자유 문자열로 받고, 아래 값을 힌트로 씁니다. */
export const SITE_TYPES = ['shop', 'landing', 'booking'] as const;

export type SiteType = (typeof SITE_TYPES)[number];

export const SITE_TYPE_LABEL: Record<SiteType, string> = {
  shop: '쇼핑몰',
  landing: '랜딩',
  booking: '예약',
};

export function isSiteType(value: unknown): value is SiteType {
  return SITE_TYPES.includes(value as SiteType);
}
