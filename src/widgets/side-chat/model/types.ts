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
  comments: PinThreadComment[];
}
