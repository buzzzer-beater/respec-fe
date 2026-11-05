import { describe, expect, it } from 'vitest';

import { parseAiSummary } from './ai-summary';

describe('parseAiSummary', () => {
  it('첫 줄은 제목, "· " 줄은 항목', () => {
    expect(parseAiSummary('메인 배너 리디자인\n· 색상: 흰색\n\n· 톤: 차분하게')).toEqual({
      title: '메인 배너 리디자인',
      items: ['색상: 흰색', '톤: 차분하게'],
    });
  });

  it('첫 줄부터 항목이면 제목이 없다', () => {
    expect(parseAiSummary('· 하나\n· 둘')).toEqual({ title: null, items: ['하나', '둘'] });
  });

  it('한 줄이면 제목만', () => {
    expect(parseAiSummary('헤더 글자 대비 개선')).toEqual({
      title: '헤더 글자 대비 개선',
      items: [],
    });
  });
});
