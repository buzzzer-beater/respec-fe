import type { Message } from '@/entities/message';
import type { ViewerPin } from '@/widgets/site-viewer';
import type { WorkspaceParticipant } from '@/widgets/workspace-header';

// 백엔드 API가 연결되기 전까지 쓰는 임시 데이터입니다.
export const MOCK_PROJECT = {
  name: '쇼핑몰 사이트',
  url: 'shop.example.com/products/detail',
  lastUpdatedLabel: '3일 전',
};

export const MOCK_PARTICIPANTS: WorkspaceParticipant[] = [
  { id: 'client', name: '고객' },
  { id: 'developer', name: '개발자' },
];

export const MOCK_PINS: ViewerPin[] = [
  { id: 'pin-1', number: 1, pagePath: '/products/detail', x: 68.8, y: 49.3, showBadge: true },
  { id: 'pin-3', number: 3, pagePath: '/products/detail', x: 33.3, y: 78.7, muted: true },
];

export const MOCK_MESSAGES: Message[] = [
  {
    id: 'm1',
    authorName: '고객',
    content: '상단 배너 문구 바꿔 주실 수 있나요?',
    timeLabel: '32분 전',
  },
  { id: 'm2', authorName: '개발자', content: '네, 1번 핀으로 확인했어요.', timeLabel: '30분 전' },
  {
    id: 'm3',
    authorName: '고객',
    content: '상품 사진도 조금 더 크게 보이면 좋겠어요.',
    timeLabel: '12분 전',
  },
];

export const MOCK_REQUESTS = [
  { id: 'r1', title: '상단 배너 문구 변경', statusLabel: '미해결', authorName: '고객' },
  { id: 'r3', title: '상품 사진 크기 키우기', statusLabel: '미해결', authorName: '고객' },
];
