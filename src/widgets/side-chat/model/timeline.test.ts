import { describe, expect, it } from 'vitest';

import { buildTimeline, countTalk, getEventText, type ThreadEvent } from './timeline';
import type { PinThreadComment } from './types';

const comment = (id: string, createdAt: string): PinThreadComment => ({
  id,
  authorName: 'dev@respec.app',
  authorRole: 'developer',
  isMine: false,
  content: id,
  plainText: null,
  aiStatus: 'completed',
  timeLabel: '',
  createdAt,
  edited: false,
  isDeleted: false,
});

const event = (
  fromStatus: ThreadEvent['fromStatus'],
  toStatus: ThreadEvent['toStatus'],
  createdAt: string,
  reason: string | null = null,
): ThreadEvent => ({
  fromStatus,
  toStatus,
  authorName: 'dev@respec.app',
  authorRole: 'developer',
  isMine: false,
  reason,
  createdAt,
  timeLabel: '3분 전',
});

const keys = (items: ReturnType<typeof buildTimeline>) =>
  items.map((item) => (item.kind === 'comment' ? item.comment.id : item.kind));

describe('getEventText', () => {
  it('단계마다 문구가 있고, 만든 기록은 null', () => {
    expect(getEventText('open', 'reviewing')).toBe('요청을 확인하기 시작했어요');
    expect(getEventText('reviewing', 'in_progress')).toBe('수정 작업을 시작했어요');
    expect(getEventText('in_progress', 'pending_review')).toBe('수정을 마치고 검수를 요청했어요');
    expect(getEventText('pending_review', 'resolved')).toBe('수정 결과를 승인했어요');
    expect(getEventText('pending_review', 'open')).toBe('재수정을 요청했어요');
    expect(getEventText(null, 'open')).toBeNull();
  });
});

describe('buildTimeline', () => {
  it('답글과 단계 기록을 시간 순서로 섞고 만든 기록은 뺀다', () => {
    const items = buildTimeline(
      [comment('a', '2026-01-01T00:01:00Z'), comment('b', '2026-01-01T00:03:00Z')],
      [
        event(null, 'open', '2026-01-01T00:00:00Z'),
        event('open', 'reviewing', '2026-01-01T00:02:00Z'),
      ],
    );
    expect(keys(items)).toEqual(['a', 'event', 'b']);
    expect(items[1]).toMatchObject({
      text: 'dev@respec.app 님이 요청을 확인하기 시작했어요 · 3분 전',
    });
  });

  it('재수정 요청은 사유 말풍선 다음에 알약을 둔다', () => {
    const items = buildTimeline(
      [],
      [event('pending_review', 'open', '2026-01-01T00:02:00Z', ' 아직 작아요 ')],
    );
    expect(keys(items)).toEqual(['reason', 'event']);
    expect(items[0]).toMatchObject({ content: '재수정 요청: 아직 작아요' });
    expect(countTalk(items)).toBe(1);
  });

  it('같은 시각이면 답글을 먼저 둔다', () => {
    const at = '2026-01-01T00:02:00Z';
    expect(keys(buildTimeline([comment('a', at)], [event('open', 'reviewing', at)]))).toEqual([
      'a',
      'event',
    ]);
  });
});
