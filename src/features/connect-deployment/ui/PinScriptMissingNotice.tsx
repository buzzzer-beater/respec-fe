'use client';

import { useState } from 'react';

import { useGetProject } from '@/entities/project';
import { can } from '@/entities/user';

import ConnectDeploymentDialog from './ConnectDeploymentDialog';

export const PIN_SCRIPT_MISSING_MESSAGE = '이 사이트에 핀 스크립트가 없어서 핀을 찍을 수 없어요';

interface PinScriptMissingNoticeProps {
  projectId: number;
}

/**
 * 배포 사이트에 핀 스크립트가 없을 때 뷰어 위에 띄우는 주황 안내(FE#80).
 * 개발자는 "설치 방법"으로 배포 연결 대화상자를 열고, 고객은 개발자에게 설치를 요청하도록 안내합니다.
 */
const PinScriptMissingNotice = ({ projectId }: PinScriptMissingNoticeProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: project } = useGetProject(projectId);
  const canConnect = can(project?.my_role, 'connect-deployment');

  return (
    <>
      <div
        role="status"
        className="text-warn flex w-max max-w-full items-center gap-2 rounded-xl bg-[#fff4e8] py-2 pr-2 pl-3.5 text-[13px] font-semibold shadow-[0_2px_10px_rgba(178,92,12,0.12)]"
      >
        <span className={canConnect ? undefined : 'pr-1.5'}>
          {PIN_SCRIPT_MISSING_MESSAGE}
          {!canConnect && ' · 개발자에게 설치를 요청해 주세요'}
        </span>
        {canConnect && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="text-ink shrink-0 rounded-lg bg-white px-2.5 py-1 text-xs font-bold hover:bg-white/80"
          >
            설치 방법
          </button>
        )}
      </div>
      {isOpen && project && (
        <ConnectDeploymentDialog
          projectId={projectId}
          currentUrl={project.deployment_url}
          banner="사이트 <head>에 핀 스크립트를 넣고 다시 배포하면 핀을 찍을 수 있어요."
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default PinScriptMissingNotice;
