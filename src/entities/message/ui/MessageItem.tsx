import type { ReactNode } from 'react';

import { cn } from '@/shared/lib';

interface MessageItemProps {
  /** 내 말은 오른쪽, 상대 말은 왼쪽에 둡니다. */
  isMine?: boolean;
  /** 상대 말에만 보여 줄 아바타 */
  avatar?: ReactNode;
  /** 상대 이름(이메일). 내 말에는 시간만 적습니다. */
  authorName?: string;
  /** 이름 옆 역할("고객"/"개발자") */
  authorLabel?: string;
  timeLabel: string;
  /** 말풍선 본문. 비어 있으면(핀 카드만 공유한 메시지 등) 말풍선을 그리지 않습니다. */
  content?: string | null;
  /** 고친 적이 있으면 본문 뒤에 "(수정됨)"을 붙입니다. */
  edited?: boolean;
  /** 삭제된 댓글은 투명한 테두리 말풍선에 흐린 기울임 글씨로 둡니다. */
  isDeleted?: boolean;
  /** 말풍선 대신 그릴 내용(수정 입력창 등) */
  body?: ReactNode;
  /** 말풍선 아래에 붙일 내용(AI 풀이, 수정/삭제 도구, 공유한 핀 카드 등) */
  children?: ReactNode;
  className?: string;
}

/**
 * 대화 한 줄 (demo-design `.bubble-row`). 요청 상세의 답글과 채팅 서랍이 같이 씁니다.
 * 상대 말: 아바타 + "이름 역할 · 시간" + 회색 말풍선(왼쪽 위만 각짐)
 * 내 말: 시간 + 조금 더 진한 회색 말풍선(오른쪽 위만 각짐). 결정 버튼(검정)과 겹치지 않게 보라를 쓰지 않습니다.
 */
const MessageItem = ({
  isMine = false,
  avatar,
  authorName,
  authorLabel,
  timeLabel,
  content,
  edited = false,
  isDeleted = false,
  body,
  children,
  className,
}: MessageItemProps) => (
  <div
    className={cn(
      'group/bubble flex max-w-[88%] gap-2',
      isMine && 'flex-row-reverse self-end',
      className,
    )}
  >
    {!isMine && avatar}
    <div className={cn('grid min-w-0 gap-1', isMine ? 'justify-items-end' : 'justify-items-start')}>
      <p className="text-muted text-xs">
        {isMine || !authorName ? (
          timeLabel
        ) : (
          <>
            <b className="text-ink font-bold">{authorName}</b>
            {authorLabel && ` ${authorLabel}`}
            {timeLabel && ` · ${timeLabel}`}
          </>
        )}
      </p>
      {body ??
        (isDeleted ? (
          <div className="text-faint rounded-[4px_16px_16px_16px] px-3.5 py-2.5 text-[15px] leading-[1.55] italic shadow-[inset_0_0_0_1px_var(--color-divider)]">
            {content}
          </div>
        ) : (
          content && (
            <div
              className={cn(
                'text-ink px-3.5 py-2.5 text-[15px] leading-[1.55] wrap-anywhere whitespace-pre-wrap',
                isMine
                  ? 'bg-bar rounded-[16px_4px_16px_16px]'
                  : 'bg-stage rounded-[4px_16px_16px_16px]',
              )}
            >
              {content}
              {edited && <small className="text-[11px] opacity-60"> (수정됨)</small>}
            </div>
          )
        ))}
      {children}
    </div>
  </div>
);

export default MessageItem;
