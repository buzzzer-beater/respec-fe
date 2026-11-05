import type { ChangeRequestStatus } from '@/entities/request';
import type { ProjectRole } from '@/entities/user';

import type { PinThreadComment } from './types';

/** 상태 이력 한 줄. 작성자 이름과 시간은 화면에 쓸 문구로 바꿔서 넘깁니다. */
export interface ThreadEvent {
  fromStatus: ChangeRequestStatus | null;
  toStatus: ChangeRequestStatus;
  authorName: string;
  authorRole: ProjectRole;
  isMine: boolean;
  /** 재수정 요청 사유 */
  reason: string | null;
  /** ISO 8601 */
  createdAt: string;
  timeLabel: string;
}

export type TimelineItem =
  | { kind: 'comment'; key: string; comment: PinThreadComment }
  /** 단계가 바뀐 기록. 가운데 작은 회색 알약으로 그립니다. */
  | { kind: 'event'; key: string; text: string }
  /** 재수정 요청 사유. 고객이 남긴 말이라 말풍선으로 그리고 고칠 수 없습니다. */
  | {
      kind: 'reason';
      key: string;
      authorName: string;
      authorRole: ProjectRole;
      isMine: boolean;
      content: string;
      timeLabel: string;
    };

/** 단계가 바뀔 때 대화에 남기는 문구 (demo-design `EVENT_TEXT`) */
export const getEventText = (
  fromStatus: ChangeRequestStatus | null,
  toStatus: ChangeRequestStatus,
): string | null => {
  if (fromStatus === null) return null;
  switch (toStatus) {
    case 'reviewing':
      return '요청을 확인하기 시작했어요';
    case 'in_progress':
      return '수정 작업을 시작했어요';
    case 'pending_review':
      return '수정을 마치고 검수를 요청했어요';
    case 'resolved':
      return '수정 결과를 승인했어요';
    case 'open':
      return '재수정을 요청했어요';
  }
};

/**
 * 답글과 상태 이력을 시간 순서로 한 줄에 섞습니다(답글의 답글도 들여쓰지 않음).
 * 요청을 만든 기록은 "요청" 칸에 있으니 빼고, 재수정 요청은 사유 말풍선 다음에 알약을 둡니다.
 * 같은 시각이면 답글을 먼저 둡니다.
 */
export const buildTimeline = (
  comments: PinThreadComment[],
  events: ThreadEvent[],
): TimelineItem[] => {
  const entries: { at: number; order: number; item: TimelineItem }[] = [];

  comments.forEach((comment, index) =>
    entries.push({
      at: Date.parse(comment.createdAt),
      order: index,
      item: { kind: 'comment', key: `comment-${comment.id}`, comment },
    }),
  );

  events.forEach((event, index) => {
    const text = getEventText(event.fromStatus, event.toStatus);
    if (!text) return;
    const at = Date.parse(event.createdAt);
    const order = comments.length + index * 2;
    const key = `event-${index}`;
    if (event.toStatus === 'open' && event.reason?.trim()) {
      entries.push({
        at,
        order,
        item: {
          kind: 'reason',
          key: `${key}-reason`,
          authorName: event.authorName,
          authorRole: event.authorRole,
          isMine: event.isMine,
          content: `재수정 요청: ${event.reason.trim()}`,
          timeLabel: event.timeLabel,
        },
      });
    }
    entries.push({
      at,
      order: order + 1,
      item: {
        kind: 'event',
        key,
        text: `${event.authorName} 님이 ${text}${event.timeLabel ? ` · ${event.timeLabel}` : ''}`,
      },
    });
  });

  return entries
    .sort((a, b) => (a.at === b.at || Number.isNaN(a.at - b.at) ? a.order - b.order : a.at - b.at))
    .map(({ item }) => item);
};

/** "대화 N"에 셀 개수. 단계 알약은 세지 않습니다. */
export const countTalk = (items: TimelineItem[]) =>
  items.filter((item) => item.kind !== 'event').length;
