import { useQuery, useQueryClient } from '@tanstack/react-query';

import { get } from '@/shared/api';
import { POLLING_INTERVAL_MS } from '@/shared/config';

import type { ChatMessage } from '../model/chat-message';

export const messageQueryKeys = {
  all: (projectId: number) => ['projects', projectId, 'messages'] as const,
  getMessages: (projectId: number) => ['projects', projectId, 'messages', 'list'] as const,
} as const;

/** `afterId`를 주면 그보다 id가 큰 메시지만 오름차순으로 옵니다. */
export const getMessages = (projectId: number, afterId?: number) =>
  get<ChatMessage[]>(`/projects/${projectId}/messages`, { params: { after_id: afterId } });

/** 처음에는 전체를 받고, 이후 polling에서는 마지막 메시지 다음 것만 받아 이어 붙입니다. */
export const useGetMessages = (projectId: number) => {
  const queryClient = useQueryClient();
  const queryKey = messageQueryKeys.getMessages(projectId);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const cached = queryClient.getQueryData<ChatMessage[]>(queryKey) ?? [];
      const lastId = cached.at(-1)?.id;
      if (lastId === undefined) return getMessages(projectId);

      const newer = await getMessages(projectId, lastId);
      return newer.length > 0 ? [...cached, ...newer] : cached;
    },
    refetchInterval: POLLING_INTERVAL_MS,
  });
};
