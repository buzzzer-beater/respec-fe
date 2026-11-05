import type { ChatMessage, Message } from '@/entities/message';
import type { PinComment, PinWithRequest } from '@/entities/pin';
import {
  type ChangeRequest,
  type ChangeRequestStatus,
  isHiddenByDefault,
} from '@/entities/request';
import type { ProjectRole, SessionUser } from '@/entities/user';
import { formatRelativeTime } from '@/shared/lib';
import type { PinThread } from '@/widgets/side-chat';
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

// 참여자/내 정보 API가 없어서 이름 대신 "나"와 "참여자"로만 구분합니다.
const authorName = (authorId: number, me: SessionUser | null) =>
  authorId === me?.id ? '나' : '참여자';

export const toMessages = (
  messages: ChatMessage[],
  pins: PinWithRequest[],
  me: SessionUser | null,
): Message[] => {
  const pinNumber = new Map(pins.map((pin, index) => [pin.id, index + 1]));

  return messages.map((message) => {
    const sharedPin =
      message.shared_pin_id === null ? null : `${pinNumber.get(message.shared_pin_id) ?? '?'}번 핀`;
    const content = [message.content, sharedPin && `${sharedPin}을 공유했어요`]
      .filter(Boolean)
      .join('\n');

    return {
      id: String(message.id),
      authorName: authorName(message.author_id, me),
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

/**
 * 수정 요청이 걸린 핀을 코멘트 스레드로 바꿉니다.
 * 댓글 작성자 역할을 주는 API가 없어서, 수정 요청을 만든 사람(고객만 가능)은 고객, 나머지는 개발자로 봅니다.
 */
export const toPinThreads = (
  pins: PinWithRequest[],
  commentsByPin: Map<number, PinComment[]>,
  requests: ChangeRequest[],
  me: SessionUser | null,
  myRole: ProjectRole | undefined,
): PinThread[] => {
  const pinNumber = new Map(pins.map((pin, index) => [pin.id, index + 1]));
  const clientIds = new Set(requests.map((request) => request.created_by));
  const roleOf = (authorId: number): ProjectRole => {
    if (authorId === me?.id && myRole) return myRole;
    return clientIds.has(authorId) ? 'client' : 'developer';
  };

  return getThreadPins(pins).map((pin) => ({
    id: String(pin.id),
    pinNumber: pinNumber.get(pin.id) ?? 0,
    status: pin.request_status,
    comments: [...(commentsByPin.get(pin.id) ?? [])]
      .sort((a, b) => a.id - b.id)
      .map((comment) => ({
        id: String(comment.id),
        authorName: authorName(comment.author_id, me),
        authorRole: roleOf(comment.author_id),
        content: comment.content,
        plainText: comment.ai_plain_text,
        timeLabel: formatRelativeTime(comment.created_at),
      })),
  }));
};

/** 참여자 API가 없어서 나와 채팅에 등장한 사람만 보여 줍니다. */
export const toParticipants = (
  messages: ChatMessage[],
  me: SessionUser | null,
): WorkspaceParticipant[] => {
  const ids = new Set(messages.map((message) => message.author_id));
  if (me) ids.delete(me.id);

  return [
    ...(me ? [{ id: String(me.id), name: me.email ?? '나' }] : []),
    ...[...ids].map((id) => ({ id: String(id), name: '참여자' })),
  ];
};
