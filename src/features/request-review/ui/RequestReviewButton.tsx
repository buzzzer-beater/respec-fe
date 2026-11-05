'use client';

import { useState } from 'react';

import { useGetProject } from '@/entities/project';
import type { ChangeRequest } from '@/entities/request';
import { can } from '@/entities/user';
import { buttonClassName } from '@/shared/ui';

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
  const candidates = requests.filter((request) => request.status === 'in_progress');

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClassName({ size: 'sm', className: 'shrink-0' })}
      >
        {candidates.length > 0 ? `검수 요청 만들기 · ${candidates.length}` : '검수 요청 만들기'}
      </button>
      {open && (
        <RequestReviewDialog
          projectId={projectId}
          candidates={candidates}
          hasDeployment={!!project.deployment_url}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
};

export default RequestReviewButton;
