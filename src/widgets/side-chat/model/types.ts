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
  /** 답글이면 부모 댓글 id. 최상위 댓글은 `null` */
  parentId?: string | null;
  /** 삭제된 댓글은 문구만 남기고 수정/삭제/답글을 막습니다. */
  isDeleted?: boolean;
}

/** 핀 하나 = 코멘트 스레드 하나. 첫 코멘트가 요청 본문이고 나머지는 답글입니다. */
export interface PinThread {
  id: string;
  pinNumber: number;
  status: ChangeRequestStatus;
  /** 상태 버튼에 쓰는 수정 요청 id */
  changeRequestId: number | null;
  /** AI 개발 요청 정리(수정 요청의 `ai_summary`). 정리 전이거나 실패하면 `null` */
  aiSummary?: string | null;
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
