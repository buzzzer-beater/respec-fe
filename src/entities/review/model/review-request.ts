import type { PinPosition } from '@/entities/pin/@x/review';

/** 검수 제출에 포함된 요청 하나 */
export interface ReviewItem {
  change_request_id: number;
  /**
   * 개발자가 배포본에 다시 찍은 반영 위치. 원본 핀은 옮기지 않고 따로 저장합니다.
   * 찍지 않았으면 `null`
   */
  location: PinPosition | null;
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
