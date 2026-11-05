import { describe, expect, it } from 'vitest';

import type { PinPosition } from '@/entities/pin';

import {
  describeReviewLocation,
  getReviewItemError,
  getReviewPositionTone,
  toAreaLabel,
  toReviewRequestItems,
} from './review-draft';

const position: PinPosition = {
  page_path: '/',
  element_selector: '[data-respec-id="hero"]',
  relative_x: 0.5,
  relative_y: 0.4,
  location_context: { section_name: '메인 배너' },
};

describe('getReviewItemError', () => {
  it('설명이 비었으면 설명부터 알려 준다', () => {
    expect(getReviewItemError({ note: '  ', location: null })).toBe('무엇을 고쳤는지 적어 주세요');
  });

  it('설명이 있고 위치가 없으면 위치를 알려 준다', () => {
    expect(getReviewItemError({ note: '고쳤어요', location: null })).toBe(
      '배포본에서 반영 위치를 찍어 주세요',
    );
  });

  it('둘 다 있으면 null', () => {
    expect(getReviewItemError({ note: '고쳤어요', location: position })).toBeNull();
  });
});

describe('getReviewPositionTone', () => {
  const base = { hasLocation: false, firstMissingId: 1, placingId: null };

  it('위치를 찍었으면 누르는 중이어도 set', () => {
    expect(getReviewPositionTone(1, { ...base, hasLocation: true, placingId: 1 })).toBe('set');
  });

  it('누르는 중인 카드는 placing', () => {
    expect(getReviewPositionTone(2, { ...base, placingId: 2 })).toBe('placing');
  });

  it('안 찍은 카드 중 첫 번째만 채우고 나머지는 외곽선', () => {
    expect(getReviewPositionTone(1, base)).toBe('primary');
    expect(getReviewPositionTone(2, base)).toBe('next');
  });

  it('누르는 중인 카드가 있으면 나머지는 채움으로 둔다', () => {
    expect(getReviewPositionTone(3, { ...base, placingId: 2 })).toBe('primary');
  });
});

describe('describeReviewLocation', () => {
  it('페이지 이름과 섹션 이름을 붙인다', () => {
    expect(describeReviewLocation(position)).toBe('배포본 메인 · 메인 배너');
    expect(describeReviewLocation({ ...position, page_path: '/cart' })).toBe(
      '배포본 /cart · 메인 배너',
    );
  });

  it('이름이 없으면 기본 문구, 길면 줄인다', () => {
    expect(toAreaLabel({ location_context: null })).toBe('선택한 화면 요소');
    expect(toAreaLabel({ location_context: { element_text: '가'.repeat(25) } })).toBe(
      `${'가'.repeat(20)}…`,
    );
  });
});

describe('toReviewRequestItems', () => {
  it('빈 설명과 없는 위치는 빼고, 위치는 위치 필드만 보낸다', () => {
    const extra = { ...position, id: 9 } as PinPosition;
    expect(
      toReviewRequestItems([1, 2], {
        1: { note: ' 고쳤어요 ', location: extra },
        2: { note: '  ', location: null },
      }),
    ).toEqual([
      { change_request_id: 1, location: position, implementation_note: '고쳤어요' },
      { change_request_id: 2 },
    ]);
  });
});
