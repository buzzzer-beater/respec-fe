import { useMutation, useQueryClient } from '@tanstack/react-query';

import { type EditedPinComment, type PinComment, pinQueryKeys } from '@/entities/pin';
import { del, patch, post } from '@/shared/api';

export interface PinCommentCreateReqType {
  content: string;
  /** 답글이면 부모 댓글 id. 생략하면 최상위 댓글 */
  parent_comment_id?: number;
}

export interface PinCommentUpdateReqType {
  content: string;
}

const commentsPath = (projectId: number, pinId: number) =>
  `/projects/${projectId}/pins/${pinId}/comments`;

export const postPinComment = (projectId: number, pinId: number, body: PinCommentCreateReqType) =>
  post<PinComment>(commentsPath(projectId, pinId), body);

export const patchPinComment = (
  projectId: number,
  pinId: number,
  commentId: number,
  body: PinCommentUpdateReqType,
) => patch<EditedPinComment>(`${commentsPath(projectId, pinId)}/${commentId}`, body);

export const deletePinComment = (projectId: number, pinId: number, commentId: number) =>
  del<void>(`${commentsPath(projectId, pinId)}/${commentId}`);

/** 댓글이 바뀌면 그 핀의 댓글과 핀 목록(요청 미리보기, 상태)을 다시 받습니다. */
const useInvalidatePinComments = (projectId: number, pinId: number) => {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: pinQueryKeys.getPinComments(projectId, pinId) }),
      queryClient.invalidateQueries({ queryKey: pinQueryKeys.getPins(projectId) }),
    ]);
};

// 409(해결된 요청 등)일 때도 최신 상태를 받아 오도록 실패 후에도 무효화합니다.
export const usePostPinComment = (projectId: number, pinId: number) => {
  const invalidate = useInvalidatePinComments(projectId, pinId);
  return useMutation({
    mutationFn: (body: PinCommentCreateReqType) => postPinComment(projectId, pinId, body),
    onSettled: invalidate,
  });
};

export const usePatchPinComment = (projectId: number, pinId: number) => {
  const invalidate = useInvalidatePinComments(projectId, pinId);
  return useMutation({
    mutationFn: ({ commentId, ...body }: PinCommentUpdateReqType & { commentId: number }) =>
      patchPinComment(projectId, pinId, commentId, body),
    onSettled: invalidate,
  });
};

export const useDeletePinComment = (projectId: number, pinId: number) => {
  const invalidate = useInvalidatePinComments(projectId, pinId);
  return useMutation({
    mutationFn: (commentId: number) => deletePinComment(projectId, pinId, commentId),
    onSettled: invalidate,
  });
};
