'use client';

import { useState } from 'react';

import { useGetProject } from '@/entities/project';
import { can } from '@/entities/user';
import { cn } from '@/shared/lib';

import { toDeploymentHost } from '../model/deployment-url';
import ConnectDeploymentDialog from './ConnectDeploymentDialog';

const CHIP_CLASS =
  'inline-flex h-[30px] max-w-[220px] items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap';

interface DeploymentChipProps {
  projectId: number;
}

/**
 * 상단바의 배포 주소. 개발자는 눌러서 연결·변경하고, 고객은 주소만 봅니다.
 * 연결 전에는 개발자에게만 "배포 연결" 버튼으로 보입니다.
 */
const DeploymentChip = ({ projectId }: DeploymentChipProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: project } = useGetProject(projectId);

  if (!project) return null;
  const url = project.deployment_url;
  const canConnect = can(project.my_role, 'connect-deployment');
  if (!url && !canConnect) return null;

  const content = url ? (
    <>
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-[#22a06b]" />
      <span className="truncate">{toDeploymentHost(url)}</span>
    </>
  ) : (
    '배포 연결'
  );

  if (!canConnect) {
    return (
      <span title="연결된 배포 주소" className={cn(CHIP_CLASS, 'border-divider text-text border')}>
        {content}
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        title={url ? '배포 주소 변경' : '배포 주소 연결'}
        onClick={() => setIsOpen(true)}
        className={cn(
          CHIP_CLASS,
          url ? 'border-divider text-text hover:bg-hover border bg-white' : 'bg-ink text-white',
        )}
      >
        {content}
      </button>
      {isOpen && (
        <ConnectDeploymentDialog
          projectId={projectId}
          currentUrl={url}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default DeploymentChip;
