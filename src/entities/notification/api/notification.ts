import { useQuery } from '@tanstack/react-query';

import { get, getAccessToken } from '@/shared/api';
import { NOTIFICATION_POLLING_INTERVAL_MS } from '@/shared/config';

import type { NotificationItem } from '../model/notification';

export const notificationQueryKeys = {
  all: () => ['notifications'] as const,
  getNotifications: (unread?: boolean) => ['notifications', 'list', { unread }] as const,
} as const;

/** 최신순. `unread`를 주면 읽음 여부로 거릅니다. */
export const getNotifications = (unread?: boolean) =>
  get<NotificationItem[]>('/notifications', { params: { unread } });

/** 로그인 토큰이 있을 때만 요청합니다. */
export const useGetNotifications = (unread?: boolean) =>
  useQuery({
    queryKey: notificationQueryKeys.getNotifications(unread),
    queryFn: () => getNotifications(unread),
    enabled: getAccessToken() !== null,
    refetchInterval: NOTIFICATION_POLLING_INTERVAL_MS,
  });
