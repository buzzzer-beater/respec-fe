import type { Message } from '@/entities/message';
import type { ChangeRequestStatus } from '@/entities/request';
import type { ProjectRole } from '@/entities/user';

export interface PinThreadComment {
  id: string;
  authorName: string;
  authorRole: ProjectRole;
  /** 내 코멘트는 오른쪽에 둡니다. */
  isMine?: boolean;
  authorAvatarUrl?: string;
  content: string;
  /** AI 쉬운 설명. 있으면 원문과 함께 보여 줍니다. */
  plainText?: string | null;
  timeLabel: string;
}

/** 핀 하나 = 코멘트 스레드 하나. 첫 코멘트가 요청 본문이고 나머지는 답글입니다. */
export interface PinThread {
  id: string;
  pinNumber: number;
  status: ChangeRequestStatus;
  comments: PinThreadComment[];
}

/** 채팅에 카드로 공유된 핀. 핀 목록에서 못 찾으면 번호와 경로가 `null`입니다. */
export interface SharedPin {
  id: string;
  pinNumber: number | null;
  /** 카드를 누르면 이 경로의 화면으로 이동합니다. */
  pagePath: string | null;
  preview: string | null;
  status: ChangeRequestStatus | null;
}

/** 대화 탭 메시지. 핀을 공유한 메시지는 본문 대신(또는 본문과 함께) 핀 카드를 보여 줍니다. */
export interface SideChatMessage extends Message {
  sharedPin?: SharedPin | null;
}
