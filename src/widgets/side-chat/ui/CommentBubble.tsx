'use client';

import { MessageItem } from '@/entities/message';
import { PROJECT_ROLE_LABEL, RoleAvatar } from '@/entities/user';
import { CommentEditBox } from '@/features/reply-pin';
import { cn } from '@/shared/lib';
import { AiPlainText } from '@/shared/ui';

import type { PinThreadComment } from '../model/types';

/** 말풍선 하나의 상태. 한 번에 한 댓글만 고치거나 지우는 중일 수 있습니다. */
export type CommentMode = 'idle' | 'editing' | 'deleting';

interface CommentBubbleProps {
  comment: PinThreadComment;
  /** 해결된 요청이면 고치거나 지울 수 없습니다(백엔드 409). */
  isLocked: boolean;
  mode: CommentMode;
  isPending: boolean;
  onStartEdit: () => void;
  onStartDelete: () => void;
  onCancel: () => void;
  onSave: (content: string) => Promise<unknown>;
  onConfirmDelete: () => void;
}

const toolClassName = 'text-muted hover:text-ink text-xs font-semibold transition-colors';

/** 개발자가 쓴 글은 고객에게 "쉬운 풀이", 고객이 쓴 글은 개발자에게 "개발자용 정리"를 접어 둡니다. */
export const getAiLabel = (authorRole: PinThreadComment['authorRole']) =>
  authorRole === 'developer' ? '쉬운 풀이' : '개발자용 정리';

/**
 * 요청 상세 대화의 답글 말풍선 (demo-design `renderTimelineItem`).
 * 내 답글은 마우스를 올리면 수정/삭제가 보이고, 삭제는 그 자리에서 한 번 더 묻습니다.
 */
const CommentBubble = ({
  comment,
  isLocked,
  mode,
  isPending,
  onStartEdit,
  onStartDelete,
  onCancel,
  onSave,
  onConfirmDelete,
}: CommentBubbleProps) => {
  const { authorName, authorRole, isMine, isDeleted, content, edited, timeLabel } = comment;
  const isEditing = mode === 'editing';
  const canModify = isMine && !isDeleted && !isLocked;

  return (
    <MessageItem
      isMine={isMine}
      avatar={<RoleAvatar name={authorName} role={authorRole} size={28} />}
      authorName={authorName}
      authorLabel={PROJECT_ROLE_LABEL[authorRole]}
      timeLabel={timeLabel}
      content={content}
      edited={edited}
      isDeleted={isDeleted}
      body={
        isEditing ? (
          <CommentEditBox
            initialValue={content}
            onSave={onSave}
            onCancel={onCancel}
            isPending={isPending}
          />
        ) : undefined
      }
    >
      {!isDeleted && !isEditing && (
        <AiPlainText
          plainText={comment.plainText}
          status={comment.aiStatus}
          label={getAiLabel(authorRole)}
        />
      )}
      {canModify &&
        !isEditing &&
        (mode === 'deleting' ? (
          <div className="text-muted flex items-center gap-2.5 text-xs">
            삭제할까요?
            <button
              type="button"
              onClick={onConfirmDelete}
              disabled={isPending}
              className={cn(toolClassName, 'text-warn hover:text-warn')}
            >
              삭제
            </button>
            <button type="button" onClick={onCancel} className={toolClassName}>
              취소
            </button>
          </div>
        ) : (
          // 마우스를 쓰는 화면에서는 말풍선에 올렸을 때(또는 키보드로 들어왔을 때)만 보여 줍니다.
          <div className="flex gap-2.5 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/bubble:opacity-100 [@media(hover:hover)]:focus-within:opacity-100">
            <button type="button" onClick={onStartEdit} className={toolClassName}>
              수정
            </button>
            <button type="button" onClick={onStartDelete} className={toolClassName}>
              삭제
            </button>
          </div>
        ))}
    </MessageItem>
  );
};

export default CommentBubble;
