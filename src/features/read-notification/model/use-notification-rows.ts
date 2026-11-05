import { useQueries } from '@tanstack/react-query';

import {
  getNotificationHref,
  getNotificationText,
  NOTIFICATION_ACTOR_ROLE,
  type NotificationItem,
  toNotificationPreview,
} from '@/entities/notification';
import { getPins, pinQueryKeys, type PinWithRequest, toPinNumbers } from '@/entities/pin';
import { getProjectMembers, type ProjectMember, projectQueryKeys } from '@/entities/project';
import { getReviewRequest, reviewRequestQueryKeys } from '@/entities/review';
import { formatRelativeTime } from '@/shared/lib';

export interface NotificationRow {
  notification: NotificationItem;
  text: string;
  /** "요청 미리보기… · 32분 전" */
  sub: string;
  href: string;
}

/**
 * 알림에는 보낸 사람과 핀이 없어서, 알림이 가리키는 프로젝트의 핀·참여자·검수 제출을 함께 받아 문구를 만듭니다.
 * 데이터를 받기 전에는 번호 없는 문구로 먼저 보여 줍니다.
 */
export const useNotificationRows = (notifications: NotificationItem[]): NotificationRow[] => {
  const projectIds = [...new Set(notifications.map(({ project_id }) => project_id))];
  const reviews = notifications.flatMap((notification) =>
    notification.type === 'review_requested'
      ? [{ projectId: notification.project_id, reviewRequestId: notification.review_request_id }]
      : [],
  );

  const pinQueries = useQueries({
    queries: projectIds.map((projectId) => ({
      queryKey: pinQueryKeys.getPins(projectId),
      queryFn: () => getPins(projectId),
    })),
  });
  const memberQueries = useQueries({
    queries: projectIds.map((projectId) => ({
      queryKey: projectQueryKeys.getProjectMembers(projectId),
      queryFn: () => getProjectMembers(projectId),
    })),
  });
  // 검수 제출은 바뀌지 않으므로 한 번만 받습니다.
  const reviewQueries = useQueries({
    queries: reviews.map(({ projectId, reviewRequestId }) => ({
      queryKey: reviewRequestQueryKeys.getReviewRequest(projectId, reviewRequestId),
      queryFn: () => getReviewRequest(projectId, reviewRequestId),
      staleTime: Infinity,
    })),
  });

  const pinsByProject = new Map<number, PinWithRequest[]>(
    projectIds.map((projectId, index) => [projectId, pinQueries[index]?.data ?? []]),
  );
  const membersByProject = new Map<number, ProjectMember[]>(
    projectIds.map((projectId, index) => [projectId, memberQueries[index]?.data ?? []]),
  );
  const reviewFirstRequest = new Map<number, number | undefined>(
    reviews.map(({ reviewRequestId }, index) => [
      reviewRequestId,
      reviewQueries[index]?.data?.items[0]?.change_request_id,
    ]),
  );

  return notifications.map((notification) => {
    const pins = pinsByProject.get(notification.project_id) ?? [];
    const requestId =
      notification.type === 'review_requested'
        ? reviewFirstRequest.get(notification.review_request_id)
        : notification.change_request_id;
    const pin = pins.find((candidate) => candidate.change_request_id === requestId) ?? null;
    const pinNumber = pin ? (toPinNumbers(pins).get(pin.id) ?? null) : null;
    const actorRole = NOTIFICATION_ACTOR_ROLE[notification.type];
    const actor =
      membersByProject.get(notification.project_id)?.find(({ role }) => role === actorRole)
        ?.email ?? (actorRole === 'client' ? '고객' : '개발자');
    const preview = toNotificationPreview(pin?.request_preview);
    const time = formatRelativeTime(notification.created_at);

    return {
      notification,
      text: getNotificationText(notification, { actor, pinNumber }),
      sub: preview ? `${preview} · ${time}` : time,
      href: getNotificationHref(notification, pin?.id ?? null),
    };
  });
};
