import type { ProjectRole } from '@/entities/user/@x/project';

/** `GET /projects`, `GET /projects/{id}`, `POST /projects` 응답 */
export interface Project {
  id: number;
  name: string;
  /** 현재 사용자의 프로젝트 역할 */
  my_role: ProjectRole;
  /** 연결된 배포 사이트. 연결 전에는 `null` */
  deployment_url: string | null;
  /** `resolved`가 아닌 수정 요청 수 */
  unresolved_request_count: number;
  /** 내가 다음 행동을 할 수정 요청 수. 개발자는 요청 대기·확인 중·작업 중, 고객은 검수 대기 */
  my_turn_count: number;
  /** 현재 초안이 있는지 */
  has_draft: boolean;
  /**
   * 배포 주소를 마지막으로 연결한 시각(ISO 8601). 연결 전이거나 이 필드가 생기기 전 프로젝트는 `null`.
   * RE:SPEC에 주소를 연결한 시각이라 Vercel이 다시 배포한 시각과는 다릅니다.
   */
  deployment_updated_at: string | null;
}

/** `GET /projects/{id}/members` 항목. 고객이 먼저, 그다음 사용자 id 오름차순입니다. */
export interface ProjectMember {
  id: number;
  email: string;
  role: ProjectRole;
}

/** `PUT /projects/{id}/deployment` 응답 */
export interface ProjectDeployment {
  deployment_url: string;
  /** ISO 8601 */
  deployment_updated_at: string | null;
}

/** `PUT`/`GET /projects/{id}/draft` 응답 */
export interface ProjectDraft {
  /** 사이트 유형. 백엔드는 자유 문자열로 받습니다. */
  site_type: string | null;
  prompt: string;
  /** 접근 키가 포함된 미리보기 URL. 재생성마다 바뀝니다. */
  preview_url: string;
  /** ISO 8601 */
  updated_at: string;
}
