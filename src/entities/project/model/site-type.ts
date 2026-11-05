/** 초안 사이트 유형. 백엔드는 자유 문자열로 받고, 아래 값을 힌트로 씁니다. */
export const SITE_TYPES = ['shop', 'landing', 'booking', 'portfolio'] as const;

export type SiteType = (typeof SITE_TYPES)[number];

export const SITE_TYPE_LABEL: Record<SiteType, string> = {
  shop: '쇼핑몰',
  landing: '랜딩',
  booking: '예약',
  portfolio: '포트폴리오',
};

/** 사이트 유형 카드 아래 설명 */
export const SITE_TYPE_DESCRIPTION: Record<SiteType, string> = {
  shop: '상품 목록 · 상세 · 장바구니',
  landing: '소개 · 특징 · 문의',
  booking: '메뉴 · 날짜 선택 · 예약 확인',
  portfolio: '작업 목록 · 상세 · 연락처',
};

export function isSiteType(value: unknown): value is SiteType {
  return SITE_TYPES.includes(value as SiteType);
}
