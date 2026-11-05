import { type PinPosition, type PinSource, toPageLabel } from '@/entities/pin';

import type { ReviewRequestCreateReqType } from '../api/review-request';

/** 검수 요청 화면에서 고를 수 있는 작업 중 요청 */
export interface ReviewCandidate {
  requestId: number;
  /** 핀 없는 채팅 요청은 `null` */
  pinNumber: number | null;
  /** 고객이 남긴 요청 원문 */
  text: string;
  /** 원래 핀을 남긴 사이트와 페이지. 핀 없는 요청은 `null` */
  source: PinSource | null;
  pagePath: string | null;
}

/** 고른 요청 하나에 개발자가 채우는 내용 */
export interface ReviewDraftItem {
  note: string;
  location: PinPosition | null | undefined;
}

/** 빠진 내용 안내. 설명을 먼저, 그다음 반영 위치를 봅니다. 다 채웠으면 `null`입니다. */
export const getReviewItemError = ({ note, location }: ReviewDraftItem): string | null => {
  if (!note.trim()) return '무엇을 고쳤는지 적어 주세요';
  if (!location) return '배포본에서 반영 위치를 찍어 주세요';
  return null;
};

/**
 * 반영 위치 버튼 모양.
 * - `set`: 찍었음(초록 표시 + 다시 찍기)
 * - `placing`: 지금 사이트에서 누르는 중
 * - `primary`: 아직 안 찍은 카드 중 첫 번째(보라 채움). 누르는 중인 카드가 있으면 나머지도 이 모양입니다.
 * - `next`: 그 뒤에 기다리는 카드(외곽선)
 */
export type ReviewPositionTone = 'set' | 'placing' | 'primary' | 'next';

export const getReviewPositionTone = (
  requestId: number,
  {
    hasLocation,
    firstMissingId,
    placingId,
  }: { hasLocation: boolean; firstMissingId: number | null; placingId: number | null },
): ReviewPositionTone => {
  if (hasLocation) return 'set';
  if (placingId === requestId) return 'placing';
  if (placingId === null && firstMissingId !== requestId) return 'next';
  return 'primary';
};

/** 찍은 요소를 사람이 읽을 이름으로. 섹션 이름 → 요소 글자 → 기본 문구 순서입니다. */
export const toAreaLabel = (position: Pick<PinPosition, 'location_context'>) => {
  const context = position.location_context;
  const name = context?.section_name?.trim() || context?.element_text?.trim();
  if (!name) return '선택한 화면 요소';
  return name.length > 20 ? `${name.slice(0, 20)}…` : name;
};

/** "배포본 메인 · 상품 목록"처럼 배포본에 찍은 반영 위치를 한 줄로 */
export const describeReviewLocation = (position: PinPosition) =>
  `배포본 ${toPageLabel(position.page_path)} · ${toAreaLabel(position)}`;

/** 위치 응답에 섞인 다른 필드는 빼고 보냅니다. */
const toPinPosition = ({
  page_path,
  element_selector,
  relative_x,
  relative_y,
  location_context,
}: PinPosition): PinPosition => ({
  page_path,
  element_selector,
  relative_x,
  relative_y,
  ...(location_context && { location_context }),
});

/** 고른 요청을 보낼 항목으로. 빈 설명은 백엔드가 거절하므로 뺍니다. */
export const toReviewRequestItems = (
  requestIds: number[],
  drafts: Partial<Record<number, ReviewDraftItem>>,
): ReviewRequestCreateReqType['items'] =>
  requestIds.map((id) => {
    const note = drafts[id]?.note.trim();
    const location = drafts[id]?.location;
    return {
      change_request_id: id,
      ...(location && { location: toPinPosition(location) }),
      ...(note && { implementation_note: note }),
    };
  });
