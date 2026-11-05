'use client';

import { MessageItem } from '@/entities/message';
import { PROJECT_ROLE_LABEL } from '@/entities/user';
import { PinCommentForm } from '@/features/reply-pin';
import { cn } from '@/shared/lib';

import type { OrderedThreadComment } from '../model/thread';

interface PinThreadCommentItemProps {
  comment: OrderedThreadComment;
  /** 해결된 요청이면 답글/수정/삭제를 모두 막습니다. */
  isLocked: boolean;
  /** 요청 본문(첫 댓글)은 지울 수 없습니다. */
  canDelete: boolean;
  isEditing: boolean;
  isReplying: boolean;
  isPending: boolean;
  onStartEdit: () => void;
  onStartReply: () => void;
  onCancel: () => void;
  onEdit: (content: string) => Promise<unknown>;
  onReply: (content: string) => Promise<unknown>;
  onDelete: () => void;
}

const actionClassName = 'text-muted hover:text-ink font-semibold transition-colors';

const PinThreadCommentItem = ({
  comment,
  isLocked,
  canDelete,
  isEditing,
  isReplying,
  isPending,
  onStartEdit,
  onStartReply,
  onCancel,
  onEdit,
  onReply,
  onDelete,
}: PinThreadCommentItemProps) => {
  const { authorName, authorRole, isMine, isDeleted, content, plainText, timeLabel, depth } =
    comment;
  const message = { content, plainText, timeLabel, authorAvatarUrl: comment.authorAvatarUrl };
  const canWrite = !isLocked && !isDeleted;
  const canModify = canWrite && isMine;

  return (
    <div
      className={cn('flex flex-col gap-1.5', depth === 1 && 'border-divider ml-3 border-l-2 pl-4')}
    >
      {isEditing ? (
        <PinCommentForm
          initialValue={message.content}
          placeholder="댓글 수정"
          submitLabel="저장"
          isPending={isPending}
          onSubmit={onEdit}
          onCancel={onCancel}
          autoFocus
        />
      ) : (
        // 삭제된 댓글은 문구를 그대로 두고 흐리게 보여 줍니다.
        <div className={cn('flex flex-col', isDeleted && 'opacity-60')}>
          <MessageItem
            {...message}
            isMine={isMine}
            authorName={`${authorName} · ${PROJECT_ROLE_LABEL[authorRole]}`}
          />
        </div>
      )}

      {canWrite && !isEditing && (
        <div className={cn('flex gap-3 text-xs', isMine ? 'self-end pr-9' : 'pl-9')}>
          <button type="button" onClick={onStartReply} className={actionClassName}>
            답글
          </button>
          {canModify && (
            <button type="button" onClick={onStartEdit} className={actionClassName}>
              수정
            </button>
          )}
          {canModify && canDelete && (
            <button type="button" onClick={onDelete} className={actionClassName}>
              삭제
            </button>
          )}
        </div>
      )}

      {isReplying && (
        <PinCommentForm
          placeholder={`${authorName}에게 답글`}
          isPending={isPending}
          onSubmit={onReply}
          onCancel={onCancel}
          autoFocus
        />
      )}
    </div>
  );
};

export default PinThreadCommentItem;
