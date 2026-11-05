import { useMutation, useQueryClient } from '@tanstack/react-query';

import { type ChatMessage, messageQueryKeys } from '@/entities/message';
import { post } from '@/shared/api';

/** 본문과 공유 핀 중 하나 이상이 있어야 합니다. */
export type MessageCreateReqType =
  { content: string; shared_pin_id?: number } | { content?: string; shared_pin_id: number };

export const postMessage = (projectId: number, body: MessageCreateReqType) =>
  post<ChatMessage>(`/projects/${projectId}/messages`, body);

export const usePostMessage = (projectId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: MessageCreateReqType) => postMessage(projectId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: messageQueryKeys.all(projectId) }),
  });
};
