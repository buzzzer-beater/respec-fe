'use client';

import { useState } from 'react';

import { MessageItem } from '@/entities/message';
import { PROJECT_ROLE_LABEL, RoleAvatar } from '@/entities/user';
import {
  getPinCommentErrorMessage,
  type PinCommentAction,
  useDeletePinComment,
  usePatchPinComment,
} from '@/features/reply-pin';
import { isApiError } from '@/shared/api';
import { toast } from '@/shared/ui';

import { countTalk, type TimelineItem } from '../model/timeline';
import CommentBubble, { type CommentMode } from './CommentBubble';

interface DetailConversationProps {
  projectId: number;
  /** 핀 없는 요청은 `null`이고 답글이 없습니다. */
  pinId: number | null;
  items: TimelineItem[];
  isLocked: boolean;
}

/** 지금 고치거나 지우려는 댓글 */
type Draft = { commentId: string; mode: Exclude<CommentMode, 'idle'> } | null;

/**
 * 요청 상세의 "대화 N" (demo-design 대화 칸). 답글과 단계 기록을 시간 순서대로 한 줄에 둡니다.
 * 답글 입력창은 상세 아래(결정 버튼 옆)에 따로 있습니다.
 */
const DetailConversation = ({ projectId, pinId, items, isLocked }: DetailConversationProps) => {
  const [draft, setDraft] = useState<Draft>(null);
  // 핀 없는 요청에서는 부르지 않지만 훅은 항상 만들어 둡니다.
  const patchComment = usePatchPinComment(projectId, pinId ?? 0);
  const deleteComment = useDeletePinComment(projectId, pinId ?? 0);

  const showError = (error: unknown, action: PinCommentAction) =>
    toast(
      isApiError(error)
        ? getPinCommentErrorMessage(error, action)
        : '알 수 없는 오류가 발생했어요.',
    );

  const save = async (commentId: string, content: string) => {
    try {
      await patchComment.mutateAsync({ commentId: Number(commentId), content });
      setDraft(null);
    } catch (error) {
      showError(error, 'edit');
      throw error;
    }
  };

  const remove = (commentId: string) =>
    deleteComment.mutate(Number(commentId), {
      onSuccess: () => {
        setDraft(null);
        toast('답글을 삭제했어요');
      },
      onError: (error) => showError(error, 'delete'),
    });

  return (
    <section className="bg-white px-9 py-8">
      <h3 className="text-ink mb-3.5 text-base font-extrabold">
        대화 <em className="text-muted font-semibold not-italic">{countTalk(items)}</em>
      </h3>
      {items.length === 0 ? (
        <p className="text-muted text-[13px]">
          {pinId === null
            ? '채팅에서 등록한 요청이라 답글 스레드가 없어요. 대화는 채팅에서 이어가요.'
            : '아직 대화가 없어요.'}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => {
            if (item.kind === 'event') {
              return (
                <p
                  key={item.key}
                  className="bg-hover text-muted self-center rounded-full px-3 py-1 text-center text-xs font-semibold"
                >
                  {item.text}
                </p>
              );
            }
            if (item.kind === 'reason') {
              return (
                <MessageItem
                  key={item.key}
                  isMine={item.isMine}
                  avatar={<RoleAvatar name={item.authorName} role={item.authorRole} size={28} />}
                  authorName={item.authorName}
                  authorLabel={PROJECT_ROLE_LABEL[item.authorRole]}
                  timeLabel={item.timeLabel}
                  content={item.content}
                />
              );
            }
            const { comment } = item;
            const mode = draft?.commentId === comment.id ? draft.mode : 'idle';
            return (
              <CommentBubble
                key={item.key}
                comment={comment}
                isLocked={isLocked}
                mode={mode}
                isPending={patchComment.isPending || deleteComment.isPending}
                onStartEdit={() => setDraft({ commentId: comment.id, mode: 'editing' })}
                onStartDelete={() => setDraft({ commentId: comment.id, mode: 'deleting' })}
                onCancel={() => setDraft(null)}
                onSave={(content) => save(comment.id, content)}
                onConfirmDelete={() => remove(comment.id)}
              />
            );
          })}
        </div>
      )}
    </section>
  );
};

export default DetailConversation;
