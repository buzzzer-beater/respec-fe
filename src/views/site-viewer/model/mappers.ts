import type { ChatMessage } from '@/entities/message';
import {
  getPinLook,
  isDeletedPinComment,
  type PinComment,
  type PinWithRequest,
} from '@/entities/pin';
import type { ProjectMember } from '@/entities/project';
import {
  type ChangeRequest,
  type ChangeRequestStatus,
  isHiddenByDefault,
} from '@/entities/request';
import type { ProjectRole, User } from '@/entities/user';
import { formatRelativeTime } from '@/shared/lib';
import type { PinThread, SharedPin, SideChatMessage } from '@/widgets/side-chat';
import type { ViewerPin } from '@/widgets/site-viewer';

/** 배포 URL의 경로. 연결 전이거나 잘못된 URL이면 `/` */
export const getPagePath = (deploymentUrl: string | null | undefined) => {
  if (!deploymentUrl) return '/';
  try {
    return new URL(deploymentUrl).pathname || '/';
  } catch {
    return '/';
  }
};

/** 완료된 요청의 핀. "완료 보기"를 켜야 보입니다. */
const isHiddenPin = (pin: PinWithRequest) =>
  pin.request_status !== null && isHiddenByDefault(pin.request_status);

/**
 * 핀 번호는 생성 순서(id 오름차순)입니다. 번호를 먼저 매기고 숨길 핀을 뺍니다.
 * 마커 색은 내 역할 기준 차례로 정합니다(내 차례 보라 + 빨간 점, 상대 차례 연보라, 해결됨 회색).
 */
export const toViewerPins = (
  pins: PinWithRequest[],
  role: ProjectRole | null | undefined,
  showResolved = false,
): ViewerPin[] =>
  pins.flatMap((pin, index) =>
    !showResolved && isHiddenPin(pin)
      ? []
      : [
          {
            id: String(pin.id),
            number: index + 1,
            pagePath: pin.page_path,
            x: pin.relative_x * 100,
            y: pin.relative_y * 100,
            status: pin.request_status,
            ...getPinLook(pin.request_status, role),
            locationStatus: pin.location_status,
            anchor: pin,
          },
        ],
  );

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
): SideChatMessage[] => {
  const authorName = createAuthorName(members, me);

  return messages.map((message) => ({
    id: String(message.id),
    authorName: authorName(message.author_id),
    isMine: message.author_id === me?.id,
    // 핀 카드만 공유한 메시지는 본문이 없습니다.
    content: message.content ?? '',
    plainText: message.ai_plain_text,
    timeLabel: formatRelativeTime(message.created_at),
    sharedPin: message.shared_pin_id === null ? null : toSharedPin(message.shared_pin_id, pins),
  }));
};

/** 공유된 핀을 카드 정보로 바꿉니다. 핀 번호는 생성 순서입니다. */
const toSharedPin = (pinId: number, pins: PinWithRequest[]): SharedPin => {
  const index = pins.findIndex((pin) => pin.id === pinId);
  const pin = pins[index];
  return {
    id: String(pinId),
    pinNumber: pin ? index + 1 : null,
    pagePath: pin?.page_path ?? null,
    preview: pin?.request_preview ?? null,
    status: pin?.request_status ?? null,
  };
};

/** 채팅 메시지로 수정 요청을 만들 때 고를 수 있는 핀. 번호는 생성 순서입니다. */
export const toRequestPinOptions = (pins: PinWithRequest[]) =>
  pins.map((pin, index) => ({ id: pin.id, number: index + 1, preview: pin.request_preview }));

/** 스레드로 보여 줄 핀. 수정 요청이 없는 핀은 빼고, 해결된 핀은 `showResolved`일 때만 넣습니다. */
export const getThreadPins = (pins: PinWithRequest[], showResolved = false) =>
  pins.filter(
    (pin): pin is PinWithRequest & { request_status: ChangeRequestStatus } =>
      pin.request_status !== null && (showResolved || !isHiddenByDefault(pin.request_status)),
  );

/**
 * 수정 요청이 걸린 핀을 코멘트 스레드로 바꿉니다. 작성자 이름과 역할은 참여자 목록에서,
 * AI 개발 요청 정리는 수정 요청 목록에서 찾습니다.
 */
export const toPinThreads = (
  pins: PinWithRequest[],
  commentsByPin: Map<number, PinComment[]>,
  members: ProjectMember[],
  me: User | undefined,
  requests: ChangeRequest[],
  showResolved = false,
): PinThread[] => {
  const pinNumber = new Map(pins.map((pin, index) => [pin.id, index + 1]));
  const summaries = new Map(requests.map((request) => [request.id, request.ai_summary]));
  const authorName = createAuthorName(members, me);
  const roles = new Map(members.map((member) => [member.id, member.role]));
  // 참여자 목록을 아직 못 받았으면 개발자로 둡니다.
  const roleOf = (authorId: number): ProjectRole => roles.get(authorId) ?? 'developer';

  return getThreadPins(pins, showResolved).map((pin) => ({
    id: String(pin.id),
    pinNumber: pinNumber.get(pin.id) ?? 0,
    pagePath: pin.page_path,
    preview: pin.request_preview,
    status: pin.request_status,
    changeRequestId: pin.change_request_id,
    aiSummary:
      pin.change_request_id === null ? null : (summaries.get(pin.change_request_id) ?? null),
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
