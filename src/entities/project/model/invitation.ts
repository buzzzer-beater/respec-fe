import type { ProjectRole } from '@/entities/user/@x/project';

/** `POST /projects/{id}/invitations` 응답 */
export interface ProjectInvitation {
  id: number;
  invite_url: string;
  /** ISO 8601 */
  expires_at: string;
}

/** `GET /invitations/preview?token=` 응답 */
export interface InvitationPreview {
  project: {
    id: number;
    name: string;
  };
  invited_by: {
    id: number;
    email: string;
  };
  /** 이미 참여 중이면 기존 역할, 아니면 `developer` */
  me: {
    id: number;
    email: string;
    role: ProjectRole;
  };
  /** ISO 8601 */
  expires_at: string;
  already_member: boolean;
}

/** `POST /invitations/accept` 응답 */
export interface InvitationAcceptance {
  project_id: number;
  role: ProjectRole;
}
