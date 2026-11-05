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
  /** 상태 버튼에 쓰는 수정 요청 id */
  changeRequestId: number | null;
  comments: PinThreadComment[];
}
