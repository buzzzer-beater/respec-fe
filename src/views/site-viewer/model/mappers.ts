import type { ChatMessage, Message } from '@/entities/message';
import type { PinWithRequest } from '@/entities/pin';
import type { ProjectMember } from '@/entities/project';
import { CHANGE_REQUEST_STATUS_LABEL, type ChangeRequest } from '@/entities/request';
import { PROJECT_ROLE_LABEL, type User } from '@/entities/user';
import { formatRelativeTime } from '@/shared/lib';
import type { ViewerPin } from '@/widgets/site-viewer';
import type { WorkspaceParticipant } from '@/widgets/workspace-header';

/**
 * 사이트 미리보기 방식이 정해지기 전까지는 요소를 고를 수 없어서,
 * 사이트 영역 전체를 앵커로 두고 영역 안 상대 좌표(0~1)만 저장합니다.
 */
export const VIEWER_ANCHOR_SELECTOR = 'body';

/** 배포 URL의 경로. 연결 전이거나 잘못된 URL이면 `/` */
export const getPagePath = (deploymentUrl: string | null | undefined) => {
  if (!deploymentUrl) return '/';
  try {
    return new URL(deploymentUrl).pathname || '/';
  } catch {
    return '/';
  }
};

/** 핀 번호는 생성 순서(id 오름차순)입니다. */
export const toViewerPins = (pins: PinWithRequest[]): ViewerPin[] =>
  pins.map((pin, index) => ({
    id: String(pin.id),
    number: index + 1,
    pagePath: pin.page_path,
    x: pin.relative_x * 100,
    y: pin.relative_y * 100,
    // 해결됐거나 요청이 없는 핀은 연하게 보여 줍니다.
    muted: pin.request_status === null || pin.request_status === 'resolved',
  }));

/** 작성자 id를 "나" 또는 이메일로 바꿉니다. 참여자 목록을 못 받으면 "참여자"입니다. */
const createAuthorName = (members: ProjectMember[], me: User | undefined) => {
  const emails = new Map(members.map((member) => [member.id, member.email]));
  return (authorId: number) => (authorId === me?.id ? '나' : (emails.get(authorId) ?? '참여자'));
};

export const toMessages = (
  messages: ChatMessage[],
  pins: PinWithRequest[],
  members: ProjectMember[],
  me: User | undefined,
): Message[] => {
  const pinNumber = new Map(pins.map((pin, index) => [pin.id, index + 1]));
  const authorName = createAuthorName(members, me);

  return messages.map((message) => {
    const sharedPin =
      message.shared_pin_id === null ? null : `${pinNumber.get(message.shared_pin_id) ?? '?'}번 핀`;
    const content = [message.content, sharedPin && `${sharedPin}을 공유했어요`]
      .filter(Boolean)
      .join('\n');

    return {
      id: String(message.id),
      authorName: authorName(message.author_id),
      content,
      plainText: message.ai_plain_text,
      timeLabel: formatRelativeTime(message.created_at),
    };
  });
};

export const toRequestCards = (
  requests: ChangeRequest[],
  pins: PinWithRequest[],
  members: ProjectMember[],
  me: User | undefined,
) => {
  const pinPreview = new Map(pins.map((pin) => [pin.id, pin.request_preview]));
  const authorName = createAuthorName(members, me);

  return requests.map((request) => ({
    id: String(request.id),
    title:
      request.ai_summary ??
      (request.pin_id === null ? null : pinPreview.get(request.pin_id)) ??
      `수정 요청 #${request.id}`,
    statusLabel: CHANGE_REQUEST_STATUS_LABEL[request.status],
    authorName: authorName(request.created_by),
  }));
};

/** 참여자 목록을 못 받으면 나만 보여 줍니다. */
export const toParticipants = (
  members: ProjectMember[],
  me: User | undefined,
): WorkspaceParticipant[] => {
  if (members.length === 0) return me ? [{ id: String(me.id), name: me.email }] : [];

  return members.map((member) => ({
    id: String(member.id),
    name: `${member.email} (${PROJECT_ROLE_LABEL[member.role]})`,
  }));
};
