import { describe, expect, it } from 'vitest';

import type { ChatMessage } from '@/entities/message';
import type { PinComment, PinWithRequest } from '@/entities/pin';
import type { ProjectMember } from '@/entities/project';
import type { ChangeRequest } from '@/entities/request';
import type { ReviewItem } from '@/entities/review';

import { getReviewItemRequestIds, toMessages, toPinThreads } from './mappers';

const members: ProjectMember[] = [
  { id: 1, email: 'client@respec.app', role: 'client' },
  { id: 2, email: 'dev@respec.app', role: 'developer' },
];
const me = { id: 1, email: 'client@respec.app' };

const pin = (id: number, overrides: Partial<PinWithRequest> = {}): PinWithRequest => ({
  id,
  source: 'draft',
  page_path: '/',
  element_selector: '#hero',
  relative_x: 0.5,
  relative_y: 0.5,
  location_context: null,
  location_status: 'located',
  change_request_id: id * 10,
  request_status: 'open',
  request_preview: `미리보기 ${id}`,
  ...overrides,
});

const request = (id: number, overrides: Partial<ChangeRequest> = {}): ChangeRequest => ({
  id,
  created_by: 1,
  pin_id: id / 10,
  source: 'draft',
  source_pin_comment_id: 1,
  source_chat_message_id: null,
  status: 'open',
  ai_summary: `정리 ${id}`,
  ...overrides,
});

const comment = (id: number, authorId: number, content: string): PinComment => ({
  id,
  author_id: authorId,
  parent_comment_id: null,
  content,
  ai_plain_text: null,
  ai_status: 'pending',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  edited: id === 3,
});

const message = (id: number, overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id,
  author_id: 1,
  content: `메시지 ${id}`,
  shared_pin_id: null,
  ai_plain_text: null,
  ai_status: 'completed',
  created_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

const sources = {
  members,
  me,
  reviewItems: new Map<number, ReviewItem>(),
  messages: [] as ChatMessage[],
};

describe('toPinThreads', () => {
  it('첫 댓글은 요청 원문, 나머지는 대화로 나누고 작성자를 이메일로 바꾼다', () => {
    const [thread] = toPinThreads({
      ...sources,
      pins: [pin(1)],
      requests: [request(10)],
      commentsByPin: new Map([[1, [comment(3, 2, '답글'), comment(2, 1, '요청 원문')]]]),
    });
    expect(thread).toMatchObject({
      id: '1',
      pinNumber: 1,
      title: '요청 원문',
      aiSummary: '정리 10',
      requestAuthorName: 'client@respec.app',
    });
    expect(thread.comments).toHaveLength(1);
    expect(thread.comments[0]).toMatchObject({
      authorName: 'dev@respec.app',
      authorRole: 'developer',
      isMine: false,
      edited: true,
      aiStatus: 'pending',
    });
  });

  it('해결된 요청도 넣고, 배포본 반영 위치 경로를 붙인다', () => {
    const [thread] = toPinThreads({
      ...sources,
      pins: [pin(1, { request_status: 'resolved' })],
      requests: [request(10, { status: 'resolved' })],
      commentsByPin: new Map(),
      reviewItems: new Map([
        [
          10,
          {
            change_request_id: 10,
            location: { page_path: '/cart', element_selector: '#a', relative_x: 0, relative_y: 0 },
            implementation_note: null,
            ai_plain_text: null,
            ai_status: 'skipped',
          },
        ],
      ]),
    });
    expect(thread).toMatchObject({
      status: 'resolved',
      reviewPagePath: '/cart',
      title: '미리보기 1',
    });
  });

  it('핀 없는 채팅 요청은 메시지를 원문으로 핀 요청 뒤에 둔다', () => {
    const threads = toPinThreads({
      ...sources,
      pins: [pin(1)],
      requests: [
        request(10),
        request(20, { pin_id: null, source: null, source_chat_message_id: 7, created_by: 1 }),
      ],
      commentsByPin: new Map(),
      messages: [message(7, { content: '버튼 색 바꿔 주세요' })],
    });
    expect(threads.map(({ id }) => id)).toEqual(['1', 'request-20']);
    expect(threads[1]).toMatchObject({
      pinId: null,
      pinNumber: null,
      source: null,
      title: '버튼 색 바꿔 주세요',
      requestAuthorName: 'client@respec.app',
    });
  });

  it('수정 요청이 없는 핀은 뺀다', () => {
    expect(
      toPinThreads({
        ...sources,
        pins: [pin(1, { change_request_id: null, request_status: null })],
        requests: [],
        commentsByPin: new Map(),
      }),
    ).toEqual([]);
  });
});

describe('toMessages', () => {
  it('공유한 핀과 등록 여부, AI 상태를 붙인다', () => {
    const [shared, registered] = toMessages(
      [message(1, { content: null, shared_pin_id: 99, ai_status: 'skipped' }), message(2)],
      [pin(1)],
      members,
      me,
      [request(10, { source_chat_message_id: 2 })],
    );
    expect(shared).toMatchObject({
      content: '',
      isMine: true,
      aiStatus: 'skipped',
      sharedPin: { id: '99', pinNumber: null, pagePath: null },
      isRegistered: false,
    });
    expect(registered).toMatchObject({ authorName: 'client@respec.app', isRegistered: true });
  });
});

describe('getReviewItemRequestIds', () => {
  it('검수 대기와, 완료 보기를 켰을 때 해결된 요청만 고른다', () => {
    const requests = [
      request(10, { status: 'pending_review' }),
      request(20, { status: 'resolved' }),
      request(30, { status: 'in_progress' }),
    ];
    expect(getReviewItemRequestIds(requests)).toEqual([10]);
    expect(getReviewItemRequestIds(requests, true)).toEqual([10, 20]);
  });
});
