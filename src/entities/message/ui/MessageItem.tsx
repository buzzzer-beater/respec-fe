import type { ReactNode } from 'react';

import { cn } from '@/shared/lib';
import { Avatar, PlainTextExplanation } from '@/shared/ui';

import type { Message } from '../model/types';

type MessageItemProps = Omit<Message, 'id'> & {
  /** 말풍선 아래에 붙일 내용(공유한 핀 카드 등) */
  children?: ReactNode;
};

// 내 메시지는 오른쪽 연보라 말풍선, 상대 메시지는 왼쪽 회색 말풍선입니다.
const MessageItem = ({
  authorName,
  authorAvatarUrl,
  isMine = false,
  content,
  plainText,
  timeLabel,
  children,
}: MessageItemProps) => {
  return (
    <div className={cn('flex max-w-[88%] gap-2', isMine && 'flex-row-reverse self-end')}>
      <Avatar
        src={authorAvatarUrl}
        alt={authorName}
        size={28}
        className={isMine ? 'bg-brand' : 'bg-ink'}
      />
      <div
        className={cn('grid min-w-0 gap-1', isMine ? 'justify-items-end' : 'justify-items-start')}
      >
        <p className="text-muted text-xs">
          {authorName}
          {timeLabel && ` · ${timeLabel}`}
        </p>
        {/* 핀 카드만 공유한 메시지는 본문이 비어 있어 말풍선을 그리지 않습니다. */}
        {content && (
          <div
            className={cn(
              'text-ink px-3.5 py-2.5 text-[15px] leading-normal',
              isMine
                ? 'bg-brand-soft rounded-[16px_4px_16px_16px]'
                : 'bg-stage rounded-[4px_16px_16px_16px]',
            )}
          >
            <PlainTextExplanation original={content} plainText={plainText} />
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default MessageItem;
