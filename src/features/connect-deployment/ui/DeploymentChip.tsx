'use client';

import { useState } from 'react';

import { useGetProject } from '@/entities/project';
import { can } from '@/entities/user';
import { cn } from '@/shared/lib';
import { Icon } from '@/shared/ui';

import { toDeploymentHost } from '../model/deployment-url';
import ConnectDeploymentDialog from './ConnectDeploymentDialog';

interface DeploymentChipProps {
  projectId: number;
  /** 개발자가 새 주소를 연결하거나 바꾼 뒤. 부모는 배포본 B로 옮기는 데 씁니다. */
  onConnected?: (url: string) => void;
}

/**
 * 상단바의 배포 주소(demo-design `.deploy-chip`). 개발자는 눌러서 연결·변경하고, 고객은 주소만 봅니다.
 * 연결 전에는 개발자에게만 검정 "배포 연결" 버튼으로 보입니다.
 */
const DeploymentChip = ({ projectId, onConnected }: DeploymentChipProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: project } = useGetProject(projectId);

  if (!project) return null;
  const url = project.deployment_url;
  const canConnect = can(project.my_role, 'connect-deployment');
  if (!url && !canConnect) return null;

  return (
    <>
      <button
        type="button"
        // 고객은 눌러도 아무것도 하지 않는 주소 표시입니다.
        disabled={!canConnect}
        title={canConnect ? (url ? '배포 주소 변경' : '배포 주소 연결') : '연결된 배포 주소'}
        onClick={() => setIsOpen(true)}
        className={cn(
          'inline-flex h-[30px] max-w-[220px] items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold whitespace-nowrap disabled:cursor-default',
          url ? 'border-divider text-text bg-white' : 'bg-ink border-transparent text-white',
        )}
      >
        {url ? (
          <>
            <span aria-hidden className="bg-ok size-1.5 shrink-0 rounded-full" />
            <span className="truncate">{toDeploymentHost(url)}</span>
          </>
        ) : (
          <>
            <Icon name="link" size={13} />
            <span className="truncate">배포 연결</span>
          </>
        )}
      </button>
      {isOpen && (
        <ConnectDeploymentDialog
          projectId={projectId}
          currentUrl={url}
          onClose={() => setIsOpen(false)}
          onConnected={onConnected}
        />
      )}
    </>
  );
};

export default DeploymentChip;
