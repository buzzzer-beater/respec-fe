import type { ChatMessage, Message } from '@/entities/message';
import { isDeletedPinComment, type PinComment, type PinWithRequest } from '@/entities/pin';
import type { ProjectMember } from '@/entities/project';
import { type ChangeRequestStatus, isHiddenByDefault } from '@/entities/request';
import type { ProjectRole, User } from '@/entities/user';
import { formatRelativeTime } from '@/shared/lib';
import type { PinThread } from '@/widgets/side-chat';
import type { ViewerPin } from '@/widgets/site-viewer';

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
      isMine: message.author_id === me?.id,
      content,
      plainText: message.ai_plain_text,
      timeLabel: formatRelativeTime(message.created_at),
    };
  });
};

/** 스레드로 보여 줄 핀. 수정 요청이 없거나 해결된 핀은 기본 화면에서 뺍니다. */
export const getThreadPins = (pins: PinWithRequest[]) =>
  pins.filter(
    (pin): pin is PinWithRequest & { request_status: ChangeRequestStatus } =>
      pin.request_status !== null && !isHiddenByDefault(pin.request_status),
  );

/** 수정 요청이 걸린 핀을 코멘트 스레드로 바꿉니다. 작성자 이름과 역할은 참여자 목록에서 찾습니다. */
export const toPinThreads = (
  pins: PinWithRequest[],
  commentsByPin: Map<number, PinComment[]>,
  members: ProjectMember[],
  me: User | undefined,
): PinThread[] => {
  const pinNumber = new Map(pins.map((pin, index) => [pin.id, index + 1]));
  const authorName = createAuthorName(members, me);
  const roles = new Map(members.map((member) => [member.id, member.role]));
  // 참여자 목록을 아직 못 받았으면 개발자로 둡니다.
  const roleOf = (authorId: number): ProjectRole => roles.get(authorId) ?? 'developer';

  return getThreadPins(pins).map((pin) => ({
    id: String(pin.id),
    pinNumber: pinNumber.get(pin.id) ?? 0,
    status: pin.request_status,
    comments: [...(commentsByPin.get(pin.id) ?? [])]
      .sort((a, b) => a.id - b.id)
      .map((comment) => ({
        id: String(comment.id),
        authorName: authorName(comment.author_id),
        authorRole: roleOf(comment.author_id),
        isMine: comment.author_id === me?.id,
        content: comment.content,
        plainText: comment.ai_plain_text,
        timeLabel: formatRelativeTime(comment.created_at),
        parentId: comment.parent_comment_id === null ? null : String(comment.parent_comment_id),
        isDeleted: isDeletedPinComment(comment),
      })),
  }));
};
