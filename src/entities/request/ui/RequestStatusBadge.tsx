import { cn } from '@/shared/lib';

import {
  CHANGE_REQUEST_STATUS_TONE,
  type ChangeRequestStatus,
  type RequestStatusTone,
} from '../model/status';

interface RequestStatusBadgeProps {
  label: string;
  /** 주면 핀 마커와 같은 기준으로 상태 색을 입힙니다. 없으면 회색입니다. */
  status?: ChangeRequestStatus;
}

const TONE_CLASS: Record<RequestStatusTone, string> = {
  brand: 'bg-brand-soft text-brand',
  ink: 'bg-ink text-white',
  warn: 'bg-[#fff4e8] text-warn',
  faint: 'bg-hover text-muted',
};

const RequestStatusBadge = ({ label, status }: RequestStatusBadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap',
        status ? TONE_CLASS[CHANGE_REQUEST_STATUS_TONE[status]] : 'bg-hover text-text',
      )}
    >
      {label}
    </span>
  );
};

export default RequestStatusBadge;
