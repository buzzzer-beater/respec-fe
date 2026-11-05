'use client';

import { type ReactNode, useState } from 'react';

import { CHANGE_REQUEST_STATUS_LABEL, RequestStatusBadge } from '@/entities/request';
import type { ProjectRole } from '@/entities/user';
import { ChangeRequestStatusButtons } from '@/features/change-request-status';
import {
  getPinCommentErrorMessage,
  type PinCommentAction,
  PinCommentForm,
  useDeletePinComment,
  usePatchPinComment,
  usePostPinComment,
} from '@/features/reply-pin';
import { ResolveRequestButtons } from '@/features/resolve-request';
import { isApiError } from '@/shared/api';

import { orderThreadComments } from '../model/thread';
import type { PinThread } from '../model/types';
import PinThreadCommentItem from './PinThreadCommentItem';

interface PinThreadCardProps extends PinThread {
  projectId: number;
  /** 있으면 역할에 맞는 상태 버튼을 보여 줍니다. */
  role?: ProjectRole;
  /** 머리글 오른쪽 액션(대화에 공유 등) */
  action?: ReactNode;
}

/** 답글을 다는 댓글, 또는 고치는 댓글 */
type Draft = { type: 'reply' | 'edit'; commentId: string } | null;

const PinThreadCard = ({
  projectId,
  id,
  pinNumber,
  status,
  changeRequestId,
  comments,
  role,
  action,
}: PinThreadCardProps) => {
  const pinId = Number(id);
  const [isExpanded, setIsExpanded] = useState(false);
  const [draft, setDraft] = useState<Draft>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const postComment = usePostPinComment(projectId, pinId);
  const patchComment = usePatchPinComment(projectId, pinId);
  const deleteComment = useDeletePinComment(projectId, pinId);

  // 해결된 요청에는 댓글을 남기거나 고칠 수 없습니다(백엔드 409).
  const isLocked = status === 'resolved';

  const [first, ...replies] = orderThreadComments(comments);

  // 접힌 상태에서는 마지막 답글만 보여 주고 나머지는 "더 보기"로 묶습니다.
  const hiddenCount = isExpanded ? 0 : Math.max(0, replies.length - 1);
  const visibleReplies = hiddenCount > 0 ? replies.slice(-1) : replies;

  if (!first) return null;

  /** 실패하면 문구를 보여 주고 다시 throw해서 입력한 내용을 남깁니다. */
  const run = async (action: PinCommentAction, request: Promise<unknown>) => {
    setErrorMessage(null);
    try {
      return await request;
    } catch (error) {
      setErrorMessage(
        isApiError(error)
          ? getPinCommentErrorMessage(error, action)
          : '알 수 없는 오류가 발생했어요.',
      );
      throw error;
    }
  };

  const reply = async (content: string, parentId?: string) => {
    await run(
      'create',
      postComment.mutateAsync({
        content,
        ...(parentId && { parent_comment_id: Number(parentId) }),
      }),
    );
    setDraft(null);
    // 새 답글이 접힌 쪽에 들어가지 않도록 펼칩니다.
    setIsExpanded(true);
  };

  const edit = async (commentId: string, content: string) => {
    await run('edit', patchComment.mutateAsync({ commentId: Number(commentId), content }));
    setDraft(null);
  };

  const remove = (commentId: string) => {
    if (!window.confirm('댓글을 삭제할까요?')) return;
    run('delete', deleteComment.mutateAsync(Number(commentId))).catch(() => {});
  };

  const startDraft = (next: Draft) => {
    setErrorMessage(null);
    setIsExpanded(true);
    setDraft(next);
  };

  return (
    <article className="flex w-full flex-col gap-4 bg-white px-9 py-7">
      <header className="flex flex-wrap items-center gap-2.5">
        <span className="bg-brand grid size-6 place-items-center rounded-full rounded-bl-[4px] text-xs font-extrabold text-white">
          {pinNumber}
        </span>
        <h3 className="text-base font-extrabold">{pinNumber}번 요청</h3>
        <span className="ml-auto flex items-center gap-2">
          {action}
          <RequestStatusBadge label={CHANGE_REQUEST_STATUS_LABEL[status]} status={status} />
        </span>
        {changeRequestId !== null && (
          <>
            <ChangeRequestStatusButtons
              size="sm"
              projectId={projectId}
              requestId={changeRequestId}
              status={status}
              role={role}
            />
            <ResolveRequestButtons
              size="sm"
              projectId={projectId}
              requestId={changeRequestId}
              status={status}
              role={role}
            />
          </>
        )}
      </header>

      <div className="flex flex-col gap-4">
        {[first, ...visibleReplies].map((comment, index) => (
          <div key={comment.id} className="flex flex-col">
            {index === 1 && hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="bg-hover text-muted hover:text-ink mb-4 self-center rounded-full px-3 py-1 text-xs font-semibold"
              >
                답글 {hiddenCount}개 더 보기
              </button>
            )}
            <PinThreadCommentItem
              comment={comment}
              isLocked={isLocked}
              // 첫 댓글은 요청 본문이라 지우면 409입니다.
              canDelete={comment.id !== first.id}
              isEditing={draft?.type === 'edit' && draft.commentId === comment.id}
              isReplying={draft?.type === 'reply' && draft.commentId === comment.id}
              isPending={postComment.isPending || patchComment.isPending}
              onStartEdit={() => startDraft({ type: 'edit', commentId: comment.id })}
              onStartReply={() => startDraft({ type: 'reply', commentId: comment.id })}
              onCancel={() => setDraft(null)}
              onEdit={(content) => edit(comment.id, content)}
              onReply={(content) => reply(content, comment.id)}
              onDelete={() => remove(comment.id)}
            />
          </div>
        ))}
      </div>

      {isLocked ? (
        <p className="text-muted text-xs">해결된 요청이라 댓글을 남기거나 고칠 수 없어요.</p>
      ) : (
        !draft && (
          <PinCommentForm
            placeholder={`${pinNumber}번 요청에 답글 남기기`}
            isPending={postComment.isPending}
            onSubmit={(content) => reply(content)}
          />
        )
      )}

      {errorMessage && (
        <p role="alert" className="text-warn text-xs font-semibold">
          {errorMessage}
        </p>
      )}
    </article>
  );
};

export default PinThreadCard;
