import type { ProjectRole } from './role';

/** 역할에 따라 허용 여부가 갈리는 프로젝트 액션 */
export const PROJECT_ACTIONS = [
  'generate-draft',
  'invite-developer',
  'resolve-request',
  'reopen-request',
  'create-request-from-message',
  'acknowledge-request',
  'start-request',
  'connect-deployment',
  'request-review',
] as const;

export type ProjectAction = (typeof PROJECT_ACTIONS)[number];

/** 액션마다 허용되는 역할. 백엔드 라우트의 client/developer 의존성과 같습니다. */
const ACTION_ROLE: Record<ProjectAction, ProjectRole> = {
  'generate-draft': 'client',
  'invite-developer': 'client',
  'resolve-request': 'client',
  'reopen-request': 'client',
  'create-request-from-message': 'client',
  'acknowledge-request': 'developer',
  'start-request': 'developer',
  'connect-deployment': 'developer',
  'request-review': 'developer',
};

/** 역할을 모르면(`null`/`undefined`) 항상 `false`입니다. */
export function can(role: ProjectRole | null | undefined, action: ProjectAction): boolean {
  return role != null && ACTION_ROLE[action] === role;
}
