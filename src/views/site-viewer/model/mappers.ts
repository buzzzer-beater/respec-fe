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
import type { ReviewItem } from '@/entities/review';
import type { ProjectRole, User } from '@/entities/user';
import { formatRelativeTime } from '@/shared/lib';
import type { ChatDrawerMessage, SharedPin } from '@/widgets/chat-drawer';
import { type PinThread, type PinThreadComment, toThreadId } from '@/widgets/side-chat';
import type { SitePage, ViewerPin } from '@/widgets/site-viewer';

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
            preview: pin.request_preview,
            locationStatus: pin.location_status,
            anchor: pin,
          },
        ],
  );

/** 주소창 목록에 보여 줄 페이지와 페이지별 핀 개수. `/`가 먼저, 나머지는 경로 순서입니다. */
export const toSitePages = (pins: ViewerPin[]): SitePage[] => {
  const counts = new Map<string, number>();
  for (const pin of pins) counts.set(pin.pagePath, (counts.get(pin.pagePath) ?? 0) + 1);
  return [...counts]
    .map(([path, pinCount]) => ({ path, pinCount }))
    .sort((a, b) => (a.path === '/' ? -1 : b.path === '/' ? 1 : a.path.localeCompare(b.path)));
};

/**
 * 작성자 id를 이메일과 역할로 바꿉니다. 백엔드에 이름이 없어서 이메일을 이름처럼 씁니다.
 * 참여자 목록을 아직 못 받았으면 "참여자"와 개발자로 둡니다.
 */
const createPeople = (members: ProjectMember[]) => {
  const byId = new Map(members.map((member) => [member.id, member]));
  return {
    nameOf: (userId: number) => byId.get(userId)?.email ?? '참여자',
    roleOf: (userId: number): ProjectRole => byId.get(userId)?.role ?? 'developer',
  };
};

/**
 * 채팅 서랍 메시지. 이미 수정 요청으로 등록한 메시지는 표시해 "요청으로 등록"을 숨깁니다.
 * 핀 번호는 생성 순서입니다.
 */
export const toMessages = (
  messages: ChatMessage[],
  pins: PinWithRequest[],
  members: ProjectMember[],
  me: User | undefined,
  requests: ChangeRequest[],
): ChatDrawerMessage[] => {
  const { nameOf, roleOf } = createPeople(members);
  const registered = new Set(requests.map((request) => request.source_chat_message_id));

  return messages.map((message) => ({
    id: String(message.id),
    authorName: nameOf(message.author_id),
    authorRole: roleOf(message.author_id),
    isMine: message.author_id === me?.id,
    // 핀 카드만 공유한 메시지는 본문이 없습니다.
    content: message.content ?? '',
    plainText: message.ai_plain_text,
    aiStatus: message.ai_status,
    timeLabel: formatRelativeTime(message.created_at),
    sharedPin: message.shared_pin_id === null ? null : toSharedPin(message.shared_pin_id, pins),
    isRegistered: registered.has(message.id),
  }));
};

/** 공유된 핀을 카드 정보로 바꿉니다. 핀을 못 찾으면(삭제됨) 번호와 경로가 `null`입니다. */
const toSharedPin = (pinId: number, pins: PinWithRequest[]): SharedPin => {
  const index = pins.findIndex((pin) => pin.id === pinId);
  const pin = pins[index];
  return {
    id: String(pinId),
    pinNumber: pin ? index + 1 : null,
    pagePath: pin?.page_path ?? null,
    preview: pin?.request_preview ?? null,
  };
};

/** 수정 요청이 걸린 핀. 해결된 핀은 `showResolved`일 때만 넣습니다. 댓글을 받을 핀을 고를 때 씁니다. */
export const getThreadPins = (pins: PinWithRequest[], showResolved = false) =>
  pins.filter(
    (pin): pin is PinWithRequest & { request_status: ChangeRequestStatus } =>
      pin.request_status !== null && (showResolved || !isHiddenByDefault(pin.request_status)),
  );

/**
 * 반영 위치(마지막 검수 항목)를 받아 올 요청. 검수 대기 요청과, "완료 보기"를 켰으면 해결된 요청입니다.
 * `useGetLatestReviewItems`에 넘깁니다.
 */
export const getReviewItemRequestIds = (requests: ChangeRequest[], showResolved = false) =>
  requests
    .filter(({ status }) => status === 'pending_review' || (showResolved && status === 'resolved'))
    .map(({ id }) => id);

interface ThreadSources {
  pins: PinWithRequest[];
  commentsByPin: Map<number, PinComment[]>;
  members: ProjectMember[];
  me: User | undefined;
  /** 수정 요청 전체(`status: 'all'`). AI 정리, 출처, 핀 없는 요청을 여기서 찾습니다. */
  requests: ChangeRequest[];
  /** 요청 id → 마지막 검수 항목. 배포본에서 반영 위치로 보여 줄 때 씁니다. */
  reviewItems: Map<number, ReviewItem>;
  /** 채팅에서 등록한 요청의 원문을 찾습니다. */
  messages: ChatMessage[];
}

/**
 * 수정 요청을 오른쪽 패널의 요청으로 바꿉니다. 해결된 요청도 넣고 목록에서 거릅니다.
 * - 핀이 있는 요청: 첫 댓글이 요청 원문, 나머지 댓글이 대화입니다(채팅에서 등록하며 핀을 붙였으면 메시지가 원문).
 * - 채팅에서 핀 없이 등록한 요청: 메시지가 원문이고 대화는 없습니다. 핀 요청 뒤에 둡니다.
 */
export const toPinThreads = ({
  pins,
  commentsByPin,
  members,
  me,
  requests,
  reviewItems,
  messages,
}: ThreadSources): PinThread[] => {
  const { nameOf, roleOf } = createPeople(members);
  const requestById = new Map(requests.map((request) => [request.id, request]));
  const messageById = new Map(messages.map((message) => [message.id, message]));

  const toComment = (comment: PinComment): PinThreadComment => ({
    id: String(comment.id),
    authorName: nameOf(comment.author_id),
    authorRole: roleOf(comment.author_id),
    isMine: comment.author_id === me?.id,
    content: comment.content,
    plainText: comment.ai_plain_text,
    aiStatus: comment.ai_status,
    timeLabel: formatRelativeTime(comment.created_at),
    createdAt: comment.created_at,
    edited: comment.edited,
    isDeleted: isDeletedPinComment(comment),
  });

  const sourceMessage = (request: ChangeRequest | undefined) =>
    request?.source_chat_message_id == null
      ? undefined
      : messageById.get(request.source_chat_message_id);

  const pinned = pins.flatMap((pin, index): PinThread[] => {
    if (pin.change_request_id === null || pin.request_status === null) return [];
    const request = requestById.get(pin.change_request_id);
    const message = sourceMessage(request);
    const comments = [...(commentsByPin.get(pin.id) ?? [])].sort((a, b) => a.id - b.id);
    // 채팅에서 등록한 요청이면 메시지가 원문이라 댓글은 모두 대화입니다.
    const first = message ? undefined : comments[0];
    const replies = message ? comments : comments.slice(1);
    const author = message ?? first;

    return [
      {
        id: toThreadId(pin.id, pin.change_request_id),
        pinId: pin.id,
        pinNumber: index + 1,
        source: pin.source,
        pagePath: pin.page_path,
        reviewPagePath: reviewItems.get(pin.change_request_id)?.location?.page_path ?? null,
        locationStatus: pin.location_status,
        title: message?.content || first?.content || pin.request_preview || `핀 ${index + 1} 요청`,
        status: pin.request_status,
        changeRequestId: pin.change_request_id,
        aiSummary: request?.ai_summary ?? null,
        requestAuthorName: author ? nameOf(author.author_id) : null,
        requestTimeLabel: formatRelativeTime(author?.created_at),
        comments: replies.map(toComment),
      },
    ];
  });

  const pinless = requests
    .filter((request) => request.pin_id === null)
    .map((request): PinThread => {
      const message = sourceMessage(request);
      return {
        id: toThreadId(null, request.id),
        pinId: null,
        pinNumber: null,
        source: null,
        pagePath: null,
        reviewPagePath: reviewItems.get(request.id)?.location?.page_path ?? null,
        locationStatus: null,
        title: message?.content || '채팅에서 등록한 요청',
        status: request.status,
        changeRequestId: request.id,
        aiSummary: request.ai_summary,
        requestAuthorName: nameOf(message?.author_id ?? request.created_by),
        requestTimeLabel: formatRelativeTime(message?.created_at),
        comments: [],
      };
    });

  return [...pinned, ...pinless];
};
