'use client';

import {
  canTransition,
  type ChangeRequestStatus,
  getTransitionErrorMessage,
} from '@/entities/request';
import { can, type ProjectAction, type ProjectRole } from '@/entities/user';
import { cn } from '@/shared/lib';

import { type DeveloperTransition, useChangeRequestTransition } from '../api/change-request-status';

const ACTIONS: { transition: DeveloperTransition; action: ProjectAction; label: string }[] = [
  { transition: 'acknowledge', action: 'acknowledge-request', label: '요청 확인' },
  { transition: 'start', action: 'start-request', label: '작업 시작' },
];

interface ChangeRequestStatusButtonsProps {
  projectId: number;
  requestId: number;
  status: ChangeRequestStatus;
  role: ProjectRole | null | undefined;
  size?: 'sm' | 'md';
}

/** 개발자용 확인/착수 버튼. 역할과 상태에 맞는 버튼만 보여 줍니다. */
const ChangeRequestStatusButtons = ({
  projectId,
  requestId,
  status,
  role,
  size = 'md',
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
        <button
          key={transition}
          type="button"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate({ requestId, transition })}
          className={cn(
            'bg-ink font-semibold text-white transition-transform active:scale-95 disabled:opacity-40',
            size === 'sm' ? 'h-7 rounded-lg px-2.5 text-xs' : 'h-10 rounded-xl px-4 text-sm',
          )}
        >
          {label}
        </button>
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
