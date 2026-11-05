import { useMutation, useQueryClient } from '@tanstack/react-query';

import { notificationQueryKeys, type NotificationReadResult } from '@/entities/notification';
import { patch } from '@/shared/api';

export const patchNotificationRead = (notificationId: number) =>
  patch<NotificationReadResult>(`/notifications/${notificationId}/read`);

export const usePatchNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patchNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all() }),
  });
};
