/**
 * `GET /projects`, `GET /projects/{id}`, `POST /projects` 응답.
 *
 * 현재 사용자의 프로젝트 역할(`client` | `developer`)은 응답에 없습니다.
 * 역할을 알 수 있는 곳은 초대 미리보기(`InvitationPreview.me.role`)와 수락 응답뿐이라
 * 백엔드에 필드 추가를 요청해야 합니다. 프론트에서 임의로 채우지 않습니다.
 */
export interface Project {
  id: number;
  name: string;
  /** 연결된 배포 사이트. 연결 전에는 `null` */
  deployment_url: string | null;
  /** `resolved`가 아닌 수정 요청 수 */
  unresolved_request_count: number;
}

/** `PUT /projects/{id}/deployment` 응답 */
export interface ProjectDeployment {
  deployment_url: string;
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
