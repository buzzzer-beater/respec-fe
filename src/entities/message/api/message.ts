import { useQuery } from '@tanstack/react-query';

import { get } from '@/shared/api';
import { POLLING_INTERVAL_MS } from '@/shared/config';

import type { ChatMessage } from '../model/chat-message';

export const messageQueryKeys = {
  all: (projectId: number) => ['projects', projectId, 'messages'] as const,
  getMessages: (projectId: number) => ['projects', projectId, 'messages', 'list'] as const,
} as const;

/** 페이지네이션이 없어서 매번 전체 목록이 id 오름차순으로 옵니다. */
export const getMessages = (projectId: number) =>
  get<ChatMessage[]>(`/projects/${projectId}/messages`);

export const useGetMessages = (projectId: number) =>
  useQuery({
    queryKey: messageQueryKeys.getMessages(projectId),
    queryFn: () => getMessages(projectId),
    refetchInterval: POLLING_INTERVAL_MS,
  });
