'use client';

import { useState } from 'react';

import { useGetProject } from '@/entities/project';
import { can } from '@/entities/user';
import { cn } from '@/shared/lib';

import ConnectDeploymentDialog from './ConnectDeploymentDialog';

interface ConnectDeploymentButtonProps {
  projectId: number;
  className?: string;
}

/** 개발자에게만 보입니다. 연결돼 있으면 "배포 변경"입니다. */
const ConnectDeploymentButton = ({ projectId, className }: ConnectDeploymentButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: project } = useGetProject(projectId);

  if (!project || !can(project.my_role, 'connect-deployment')) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          'border-divider text-ink hover:bg-hover h-9 rounded-[10px] border px-3.5 text-sm font-semibold whitespace-nowrap',
          className,
        )}
      >
        {project.deployment_url ? '배포 변경' : '배포 연결'}
      </button>
      {isOpen && (
        <ConnectDeploymentDialog
          projectId={projectId}
          currentUrl={project.deployment_url}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default ConnectDeploymentButton;
