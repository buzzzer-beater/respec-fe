import { useMutation, useQueryClient } from '@tanstack/react-query';

import { pinQueryKeys } from '@/entities/pin';
import { changeRequestQueryKeys, postChangeRequest } from '@/entities/request';
import type { ApiError } from '@/shared/api';

export interface RequestFromMessageVars {
  messageId: number;
  /** 관련 핀. 고르지 않으면 핀 없는 요청이 됩니다. */
  pinId?: number;
}

/** 채팅 메시지를 수정 요청으로 등록합니다. 고객만 할 수 있습니다. */
export const usePostRequestFromMessage = (projectId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, pinId }: RequestFromMessageVars) =>
      postChangeRequest(
        projectId,
        pinId === undefined
          ? { source_chat_message_id: messageId }
          : { source_chat_message_id: messageId, pin_id: pinId },
      ),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: changeRequestQueryKeys.all(projectId) }),
        queryClient.invalidateQueries({ queryKey: pinQueryKeys.all(projectId) }),
      ]),
  });
};

/** 같은 메시지를 다시 등록하거나 원본이 삭제됐으면 409입니다. */
export const getRequestFromMessageErrorMessage = (error: ApiError) =>
  error.code === 'CONFLICT' ? '이미 수정 요청으로 등록된 메시지예요.' : error.message;
