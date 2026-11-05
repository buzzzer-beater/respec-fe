'use client';

import {
  canTransition,
  type ChangeRequestStatus,
  getTransitionErrorMessage,
} from '@/entities/request';
import { can, type ProjectAction, type ProjectRole } from '@/entities/user';
import { Button, type ButtonSize, type ButtonVariant } from '@/shared/ui';

import { type DeveloperTransition, useChangeRequestTransition } from '../api/change-request-status';

const ACTIONS: { transition: DeveloperTransition; action: ProjectAction; label: string }[] = [
  { transition: 'acknowledge', action: 'acknowledge-request', label: '확인 시작' },
  { transition: 'start', action: 'start-request', label: '작업 시작' },
];

interface ChangeRequestStatusButtonsProps {
  projectId: number;
  requestId: number;
  status: ChangeRequestStatus;
  role: ProjectRole | null | undefined;
  size?: ButtonSize;
  /** 카드 목록처럼 버튼이 반복되는 곳에서는 외곽선(`secondary`)으로 씁니다. */
  variant?: ButtonVariant;
}

/** 개발자용 확인/착수 버튼. 역할과 상태에 맞는 버튼만 보여 줍니다. */
const ChangeRequestStatusButtons = ({
  projectId,
  requestId,
  status,
  role,
  size = 'md',
  variant = 'primary',
}: ChangeRequestStatusButtonsProps) => {
  const mutation = useChangeRequestTransition(projectId);
  const actions = ACTIONS.filter(
    ({ transition, action }) => can(role, action) && canTransition(status, transition),
  );
  const errorMessage = mutation.error ? getTransitionErrorMessage(mutation.error) : null;

  if (actions.length === 0 && !errorMessage) return null;

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {actions.map(({ transition, label }) => (
        <Button
          key={transition}
          size={size}
          variant={variant}
          disabled={mutation.isPending}
          onClick={() => mutation.mutate({ requestId, transition })}
        >
          {label}
        </Button>
      ))}
      {errorMessage && (
        <p role="alert" className="text-warn w-full text-right text-xs font-semibold">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default ChangeRequestStatusButtons;
