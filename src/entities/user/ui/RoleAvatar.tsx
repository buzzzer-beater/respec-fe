import { cn } from '@/shared/lib';

import type { ProjectRole } from '../model/role';

interface RoleAvatarProps {
  /** 첫 글자를 보여 줄 이름. 백엔드에 이름이 없어서 지금은 이메일을 넘깁니다. */
  name: string;
  role: ProjectRole | null;
  /** px */
  size: number;
  className?: string;
}

const ROLE_CLASS: Record<ProjectRole, string> = {
  client: 'bg-chip text-text',
  developer: 'bg-ink text-white',
};

/** demo-design `.avatar`: 고객은 회색, 개발자는 검정 원에 첫 글자를 넣습니다. */
const RoleAvatar = ({ name, role, size, className }: RoleAvatarProps) => (
  <span
    aria-hidden
    title={name}
    className={cn(
      'grid shrink-0 place-items-center rounded-full font-bold uppercase',
      role ? ROLE_CLASS[role] : 'bg-chip text-text',
      className,
    )}
    style={{ width: size, height: size, fontSize: size >= 36 ? 13 : 11 }}
  >
    {name.trim().charAt(0)}
  </span>
);

export default RoleAvatar;
