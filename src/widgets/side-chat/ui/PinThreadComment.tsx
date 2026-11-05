import { PROJECT_ROLE_LABEL } from '@/entities/user';
import { cn } from '@/shared/lib';
import { Avatar, PlainTextExplanation } from '@/shared/ui';

import type { PinThreadComment as PinThreadCommentData } from '../model/types';

const PinThreadComment = ({
  authorName,
  authorRole,
  authorAvatarUrl,
  content,
  plainText,
  timeLabel,
}: Omit<PinThreadCommentData, 'id'>) => {
  // 개발자 코멘트는 오른쪽, 고객 코멘트는 왼쪽에 둡니다.
  const isDeveloper = authorRole === 'developer';

  return (
    <div className={cn('flex w-full items-start gap-[11px]', isDeveloper && 'flex-row-reverse')}>
      <Avatar src={authorAvatarUrl} alt={authorName} size={32} />
      <div
        className={cn(
          'flex w-[219px] min-w-0 flex-col gap-2',
          isDeveloper ? 'items-end' : 'items-start',
        )}
      >
        <p className="text-ink-meta flex gap-1 text-xs leading-[normal] font-medium">
          <span className="whitespace-nowrap">{authorName}</span>
          <span aria-hidden className="font-semibold whitespace-pre">
            {'·   '}
          </span>
          <span className="whitespace-nowrap">{PROJECT_ROLE_LABEL[authorRole]}</span>
          <span aria-hidden className="font-semibold whitespace-pre">
            {'·   '}
          </span>
          <span className="whitespace-nowrap">{timeLabel}</span>
        </p>
        <div
          className={cn(
            'rounded-small text-ink-body w-full p-3 text-xs leading-[normal] break-keep',
            isDeveloper ? 'bg-primary-bubble' : 'bg-surface-bubble',
          )}
        >
          {plainText ? (
            <PlainTextExplanation original={content} plainText={plainText} />
          ) : (
            <p className="wrap-anywhere whitespace-pre-wrap">{content}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PinThreadComment;
