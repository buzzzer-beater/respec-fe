import type { PinPosition } from '@/entities/pin/@x/review';
import type { AiStatus } from '@/shared/api';

/** 검수 제출에 포함된 요청 하나 */
export interface ReviewItem {
  change_request_id: number;
  /**
   * 개발자가 배포본에 다시 찍은 반영 위치. 원본 핀은 옮기지 않고 따로 저장합니다.
   * 찍지 않았으면 `null`
   */
  location: PinPosition | null;
  /** 개발자가 쓴 수정 설명 원문. 쓰지 않았으면 `null` */
  implementation_note: string | null;
  /** 고객용 쉬운 설명. 만드는 중·실패·설명 없음이면 `null` */
  ai_plain_text: string | null;
  /** 설명이 없으면 `skipped`, 제출 직후에는 `pending` */
  ai_status: AiStatus;
}

/** `POST /review-requests`, `GET /review-requests/{id}` 응답 */
export interface ReviewRequest {
  id: number;
  requested_by: number;
  /** 검수할 배포 URL */
  deployment_url: string | null;
  items: ReviewItem[];
}

/** `GET /review-requests` 항목 (최신순) */
export interface ReviewRequestSummary {
  id: number;
  requested_by: number;
  /** ISO 8601 */
  created_at: string;
  item_count: number;
}
