import type { NotificationItem, NotificationType } from './notification';

/** 알림을 만든 사람의 역할. 백엔드가 보낸 사람을 주지 않아서 종류로 정합니다. */
export const NOTIFICATION_ACTOR_ROLE: Record<NotificationType, 'client' | 'developer'> = {
  review_requested: 'developer',
  change_reopened: 'client',
  change_created: 'client',
  change_resolved: 'client',
};

interface NotificationTextContext {
  /** 보낸 사람 이름. 지금은 이메일입니다. */
  actor: string;
  /** 알림이 가리키는 핀 번호. 모르면 `null` */
  pinNumber: number | null;
}

/** demo-design `NOTICE_TEXT` 문구 */
export const getNotificationText = (
  { type }: Pick<NotificationItem, 'type'>,
  { actor, pinNumber }: NotificationTextContext,
) => {
  const pin = pinNumber === null ? '' : `핀 ${pinNumber} `;
  switch (type) {
    case 'review_requested':
      return `${actor} 님이 ${pin}검수를 요청했어요`;
    case 'change_reopened':
      return `${actor} 님이 ${pin}재수정을 요청했어요`;
    case 'change_created':
      return `${actor} 님이 ${pin}새 요청을 남겼어요`;
    case 'change_resolved':
      return pinNumber === null
        ? `${actor} 님이 요청을 승인했어요`
        : `${actor} 님이 핀 ${pinNumber}을 승인했어요`;
  }
};

/** 알림을 누르면 작업 화면에서 그 핀을 엽니다. 핀을 모르면 작업 화면으로만 갑니다. */
export const getNotificationHref = (
  { project_id }: Pick<NotificationItem, 'project_id'>,
  pinId: number | null,
) => `/projects/${project_id}/viewer${pinId === null ? '' : `#pin-${pinId}`}`;

const PREVIEW_LENGTH = 18;

/** 알림 아래 줄의 요청 미리보기. 18자가 넘으면 줄입니다. */
export const toNotificationPreview = (text: string | null | undefined) => {
  const trimmed = text?.trim();
  if (!trimmed) return null;
  return trimmed.length > PREVIEW_LENGTH ? `${trimmed.slice(0, PREVIEW_LENGTH)}…` : trimmed;
};
