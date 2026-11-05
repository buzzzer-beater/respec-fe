import type { ProjectRole } from '@/entities/user';
import type { AiStatus } from '@/shared/api';

/** 채팅에 카드로 공유된 핀. 핀 목록에서 못 찾으면(삭제된 핀) 번호와 경로가 `null`입니다. */
export interface SharedPin {
  id: string;
  pinNumber: number | null;
  /** 카드를 누르면 이 경로의 화면으로 이동합니다. */
  pagePath: string | null;
  preview: string | null;
}

/** 채팅 서랍의 메시지 한 줄 */
export interface ChatDrawerMessage {
  id: string;
  /** 작성자 이메일. 백엔드에 이름이 없습니다. */
  authorName: string;
  authorRole: ProjectRole;
  isMine: boolean;
  /** 핀 카드만 공유한 메시지는 빈 문자열입니다. */
  content: string;
  /** AI 변환본. 만드는 중이거나 실패하면 `null` */
  plainText: string | null;
  aiStatus: AiStatus;
  timeLabel: string;
  sharedPin: SharedPin | null;
  /** 이미 수정 요청으로 등록한 메시지는 "요청으로 등록"을 숨깁니다. */
  isRegistered: boolean;
}
