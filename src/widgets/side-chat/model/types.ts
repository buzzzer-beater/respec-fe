import type { PinLocationStatus, PinSource } from '@/entities/pin';
import type { ChangeRequestStatus } from '@/entities/request';
import type { ProjectRole } from '@/entities/user';
import type { AiStatus } from '@/shared/api';

/** 요청 상세 대화에 들어가는 핀 댓글. 요청 원문(첫 댓글)은 빼고 넣습니다. */
export interface PinThreadComment {
  id: string;
  /** 작성자 이메일. 백엔드에 이름이 없습니다. */
  authorName: string;
  authorRole: ProjectRole;
  /** 내 댓글은 오른쪽에 두고 수정/삭제할 수 있습니다. */
  isMine: boolean;
  content: string;
  /** AI 변환본. 만드는 중이거나 실패하면 `null` */
  plainText: string | null;
  aiStatus: AiStatus;
  timeLabel: string;
  /** ISO 8601. 상태 이력과 섞어 시간 순서로 놓을 때 씁니다. */
  createdAt: string;
  edited: boolean;
  /** 삭제된 댓글은 문구만 남기고 수정/삭제를 막습니다. */
  isDeleted: boolean;
}

/**
 * 수정 요청 하나 = 요청 상세 하나. 핀이 있으면 핀 댓글이 대화가 되고,
 * 채팅에서 핀 없이 등록한 요청은 대화 없이 상태 이력만 있습니다.
 */
export interface PinThread {
  /** 선택 키. 핀이 있으면 핀 id, 핀 없는 요청은 `request-{요청 id}` (`toThreadId`) */
  id: string;
  pinId: number | null;
  /** 핀 번호(만든 순서). 핀 없는 요청은 `null` */
  pinNumber: number | null;
  /** 핀을 남긴 사이트. 핀 없는 요청은 `null` */
  source: PinSource | null;
  /** 핀이 있는 페이지 경로. 핀 없는 요청은 `null` */
  pagePath: string | null;
  /** 개발자가 검수 요청 때 배포본에 다시 찍은 반영 위치의 경로. 없으면 `null` */
  reviewPagePath: string | null;
  locationStatus: PinLocationStatus | null;
  /** 요청 원문(첫 댓글 또는 등록한 채팅 메시지) */
  title: string;
  status: ChangeRequestStatus;
  changeRequestId: number;
  /** AI 개발 요청 정리(수정 요청의 `ai_summary`). 실패하면 `null` */
  aiSummary: string | null;
  /** 요청을 남긴 사람(이메일)과 시간 */
  requestAuthorName: string | null;
  requestTimeLabel: string;
  comments: PinThreadComment[];
}

/** 사이트에서 고른 요청. 같은 요청을 다시 눌러도 이동하도록 `seq`를 올립니다. */
export interface SelectedPin {
  /** `PinThread.id` */
  id: string;
  seq: number;
}

/** 오른쪽 패널 화면. 목록과 새 요청은 좁게, 상세와 검수 요청은 넓게 씁니다. */
export type PanelView = 'list' | 'detail' | 'new' | 'review';

/** 사이트에서 핀 자리를 눌러 새 요청을 적는 중 */
export interface NewRequestDraft {
  pinNumber: number;
  source: PinSource;
  pagePath: string;
  /** 찍은 요소 이름(섹션 이름 등). 모르면 `null` */
  elementLabel: string | null;
}

/** 검수 요청 만드는 중. 열 때마다 `seq`를 올려 고른 항목을 새로 시작합니다. */
export interface ReviewSession {
  seq: number;
  /** 처음부터 골라 둘 요청 id("검수 요청에 담기") */
  preselectedIds: number[];
}
