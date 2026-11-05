import { useMutation, useQueryClient } from '@tanstack/react-query';

import { notificationQueryKeys, type NotificationReadResult } from '@/entities/notification';
import { patch, post } from '@/shared/api';

export const patchNotificationRead = (notificationId: number) =>
  patch<NotificationReadResult>(`/notifications/${notificationId}/read`);

/** 읽지 않은 알림을 한 번에 읽음 처리합니다. 이미 읽은 알림의 읽은 시각은 그대로입니다. (204) */
export const postNotificationsReadAll = () => post<void>('/notifications/read-all');

export const usePostNotificationsReadAll = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postNotificationsReadAll,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all() }),
  });
};

export const usePatchNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patchNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all() }),
  });
};
