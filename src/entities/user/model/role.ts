/** 프로젝트 참여 역할. 계정이 아니라 프로젝트마다 정해집니다. */
export const PROJECT_ROLES = ['client', 'developer'] as const;

export type ProjectRole = (typeof PROJECT_ROLES)[number];

export const PROJECT_ROLE_LABEL: Record<ProjectRole, string> = {
  client: '고객',
  developer: '개발자',
};

export function isProjectRole(value: unknown): value is ProjectRole {
  return PROJECT_ROLES.includes(value as ProjectRole);
}
