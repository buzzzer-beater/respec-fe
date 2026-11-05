'use client';

import { useState } from 'react';

import { useGetProject } from '@/entities/project';
import type { ChangeRequest } from '@/entities/request';
import { can } from '@/entities/user';

import RequestReviewDialog from './RequestReviewDialog';

interface RequestReviewButtonProps {
  projectId: number;
  /** 수정 요청 전체. 이 중 `in_progress`만 고를 수 있습니다. */
  requests: ChangeRequest[];
}

/** 개발자에게만 보입니다. */
const RequestReviewButton = ({ projectId, requests }: RequestReviewButtonProps) => {
  const { data: project } = useGetProject(projectId);
  const [open, setOpen] = useState(false);

  if (!project || !can(project.my_role, 'request-review')) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-ink h-10 shrink-0 rounded-[10px] px-4 text-sm font-bold text-white transition-transform active:scale-95"
      >
        검수 요청
      </button>
      {open && (
        <RequestReviewDialog
          projectId={projectId}
          candidates={requests.filter((request) => request.status === 'in_progress')}
          defaultDeploymentUrl={project.deployment_url ?? ''}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
};

export default RequestReviewButton;
