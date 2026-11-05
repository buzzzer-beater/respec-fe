import Link from 'next/link';

import type { Project } from '@/entities/project';
import { PROJECT_ROLE_LABEL } from '@/entities/user';

// 카드에는 주소 전체 대신 호스트만 보여 줍니다.
const toHost = (url: string) => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};

interface ProjectCardProps {
  project: Project;
}

const ProjectCard = ({ project }: ProjectCardProps) => {
  const { id, name, my_role, deployment_url, unresolved_request_count } = project;

  return (
    <Link
      href={`/projects/${id}/viewer`}
      className="border-divider hover:border-ink flex h-full flex-col gap-4 rounded-2xl border bg-white p-6 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="line-clamp-2 text-lg font-extrabold tracking-[-0.01em]">{name}</h2>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
            my_role === 'client' ? 'bg-brand-soft text-brand' : 'bg-hover text-text'
          }`}
        >
          {PROJECT_ROLE_LABEL[my_role]}
        </span>
      </div>
      <p className="text-muted truncate text-sm">
        {deployment_url ? <span title={deployment_url}>{toHost(deployment_url)}</span> : '배포 전'}
      </p>
      <p className="text-text mt-auto text-sm">
        미해결 요청 <strong className="text-ink">{unresolved_request_count}</strong>건
      </p>
    </Link>
  );
};

export default ProjectCard;
