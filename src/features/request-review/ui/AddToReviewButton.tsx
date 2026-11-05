'use client';

import { useState } from 'react';

import { useGetProject } from '@/entities/project';
import { type ChangeRequestStatus, useGetChangeRequests } from '@/entities/request';
import { can, type ProjectRole } from '@/entities/user';
import { Button, type ButtonSize, type ButtonVariant } from '@/shared/ui';

import RequestReviewDialog from './RequestReviewDialog';

interface AddToReviewDialogProps {
  projectId: number;
  requestId: number;
  onClose: () => void;
}

/** 열 때만 요청 목록을 구독합니다. 목록 화면과 같은 쿼리(`all`)라 보통 캐시에서 바로 나옵니다. */
const AddToReviewDialog = ({ projectId, requestId, onClose }: AddToReviewDialogProps) => {
  const { data: project } = useGetProject(projectId);
  const { data: requests } = useGetChangeRequests(projectId, 'all');

  if (!project || !requests) return null;

  return (
    <RequestReviewDialog
      projectId={projectId}
      candidates={requests.filter((request) => request.status === 'in_progress')}
      initialSelectedIds={[requestId]}
      defaultDeploymentUrl={project.deployment_url ?? ''}
      onClose={onClose}
    />
  );
};

interface AddToReviewButtonProps {
  projectId: number;
  requestId: number;
  status: ChangeRequestStatus;
  role: ProjectRole | null | undefined;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

/**
 * 작업 중인 요청을 검수 요청에 담습니다. 개발자에게만 보입니다.
 * 검수 요청 대화상자를 열고 이 요청을 미리 골라 둡니다.
 */
const AddToReviewButton = ({
  projectId,
  requestId,
  status,
  role,
  size = 'md',
  variant = 'primary',
}: AddToReviewButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (status !== 'in_progress' || !can(role, 'request-review')) return null;

  return (
    <>
      <Button size={size} variant={variant} onClick={() => setIsOpen(true)}>
        검수 요청에 담기
      </Button>
      {isOpen && (
        <AddToReviewDialog
          projectId={projectId}
          requestId={requestId}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default AddToReviewButton;
