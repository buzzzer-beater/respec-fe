'use client';

import { useGetProject } from '@/entities/project';
import { can } from '@/entities/user';

import ConnectDeploymentButton from './ConnectDeploymentButton';

interface DeploymentEmptyStateProps {
  projectId: number;
}

/** 사이트 뷰어에서 배포 URL이 없을 때 보여 주는 안내. 역할에 따라 문구가 다릅니다. */
const DeploymentEmptyState = ({ projectId }: DeploymentEmptyStateProps) => {
  const { data: project } = useGetProject(projectId);
  if (!project) return null;

  const canConnect = can(project.my_role, 'connect-deployment');

  return (
    <div className="absolute inset-0 grid place-items-center px-6">
      {/* 핀 모드 덮개보다 위에 두어 연결 버튼을 누를 수 있게 합니다. */}
      <div className="relative z-10 flex flex-col items-center gap-3 text-center">
        <p className="text-ink text-base font-bold">
          {canConnect ? '배포 사이트를 연결해 주세요' : '아직 배포 사이트가 없어요'}
        </p>
        <p className="text-muted text-sm leading-normal">
          {canConnect
            ? 'Vercel에 배포한 주소를 연결하면 고객이 그 사이트에서 검수할 수 있어요.'
            : '개발자가 배포 사이트를 연결하면 여기에 보여요.'}
        </p>
        {canConnect && (
          <ConnectDeploymentButton
            projectId={projectId}
            className="bg-ink hover:bg-ink mt-1 h-10 border-transparent px-4 text-white"
          />
        )}
      </div>
    </div>
  );
};

export default DeploymentEmptyState;
