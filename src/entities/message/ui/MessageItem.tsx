import { cn } from '@/shared/lib';
import { Avatar } from '@/shared/ui';

import type { Message } from '../model/types';

interface MessageItemProps extends Omit<Message, 'id' | 'replies'> {
  variant?: 'default' | 'reply';
}

const MessageItem = ({
  authorName,
  authorAvatarUrl,
  content,
  timeLabel,
  variant = 'default',
}: MessageItemProps) => {
  const isReply = variant === 'reply';

  return (
    <div className="flex w-full items-start gap-2.5">
      {isReply ? (
        <span className="flex h-12 shrink-0 items-center">
          <Avatar
            src={authorAvatarUrl}
            alt={authorName}
            size={40}
            className="border-accent border"
          />
        </span>
      ) : (
        <Avatar
          src={authorAvatarUrl}
          alt={authorName}
          size={52}
          className="ring-line-subtle ring-[0.5px]"
        />
      )}
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col gap-1 leading-[normal]',
          isReply ? 'py-1' : 'py-1.5',
        )}
      >
        <div className="text-ink-600 flex items-center gap-1.5 text-sm">
          <span className="whitespace-nowrap">{authorName}</span>
          <span aria-hidden className="bg-ink-600 size-0.5 rounded-full" />
          <span className="whitespace-nowrap">{timeLabel}</span>
        </div>
        <p className="text-ink-800 font-medium break-words">{content}</p>
      </div>
    </div>
  );
};

export default MessageItem;
