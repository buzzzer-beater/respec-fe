import { useMutation, useQueryClient } from '@tanstack/react-query';

import { type ChatMessage, messageQueryKeys } from '@/entities/message';
import { post } from '@/shared/api';

/** 핀을 카드로 채팅에 공유합니다. 본문 없이 `shared_pin_id`만 보냅니다. */
export const postSharedPin = (projectId: number, pinId: number) =>
  post<ChatMessage>(`/projects/${projectId}/messages`, { shared_pin_id: pinId });

export const useSharePin = (projectId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pinId: number) => postSharedPin(projectId, pinId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: messageQueryKeys.all(projectId) }),
  });
};
