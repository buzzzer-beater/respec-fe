import type { ApiError } from '@/shared/api';

export type PinCommentAction = 'create' | 'edit' | 'delete';

// 409는 해결된 요청, 이미 삭제된 댓글, 요청 원본 댓글 삭제일 때 옵니다.
const CONFLICT_MESSAGE: Record<PinCommentAction, string> = {
  create: '해결된 요청에는 댓글을 남길 수 없어요.',
  edit: '해결된 요청이거나 이미 삭제된 댓글이라 고칠 수 없어요.',
  delete: '해결된 요청이거나 요청 본문인 댓글이라 지울 수 없어요.',
};

/** 댓글 작성/수정/삭제 실패를 사용자에게 보여 줄 문구로 바꿉니다. */
export const getPinCommentErrorMessage = (error: ApiError, action: PinCommentAction) => {
  if (error.status === 409) return CONFLICT_MESSAGE[action];
  // 수정할 때 AI 쉬운 설명을 다시 만드는데, 실패하면 503이고 저장되지 않습니다.
  if (error.status === 503 || error.code === 'AI_UNAVAILABLE') {
    return 'AI 쉬운 설명을 만들지 못해 저장하지 못했어요. 잠시 후 다시 시도해 주세요.';
  }
  if (error.status === 403) return '내가 쓴 댓글만 고치거나 지울 수 있어요.';
  return error.message;
};
