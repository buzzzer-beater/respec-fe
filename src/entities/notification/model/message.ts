import type { NotificationItem, NotificationType } from './notification';

export const NOTIFICATION_MESSAGE: Record<NotificationType, string> = {
  review_requested: '개발자가 검수를 요청했어요',
  change_reopened: '고객이 재수정을 요청했어요',
};

/** 알림을 눌렀을 때 이동할 화면 */
export const getNotificationHref = ({ type, project_id }: NotificationItem) =>
  type === 'review_requested'
    ? `/projects/${project_id}/review`
    : `/projects/${project_id}/requests`;
