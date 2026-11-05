/** 검수 제출에 포함된 요청 하나와 반영 설명 */
export interface ReviewItem {
  change_request_id: number;
  /** 개발자가 쓴 반영 설명 원문 */
  implementation_note: string;
  /** 고객용 쉬운 설명. 변환에 실패하면 `null` */
  ai_plain_text: string | null;
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
