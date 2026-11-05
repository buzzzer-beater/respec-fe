'use client';

import { useState } from 'react';

import { MessageItem } from '@/entities/message';
import { CHANGE_REQUEST_STATUS_LABEL, RequestStatusBadge } from '@/entities/request';
import { PROJECT_ROLE_LABEL, type ProjectRole } from '@/entities/user';
import { ChangeRequestStatusButtons } from '@/features/change-request-status';
import { ResolveRequestButtons } from '@/features/resolve-request';

import type { PinThread } from '../model/types';

interface PinThreadCardProps extends Omit<PinThread, 'id'> {
  projectId?: number;
  role?: ProjectRole;
}

const PinThreadCard = ({
  pinNumber,
  status,
  changeRequestId,
  comments,
  projectId,
  role,
}: PinThreadCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [first, ...replies] = comments;

  // 접힌 상태에서는 마지막 답글만 보여 주고 나머지는 "더 보기"로 묶습니다.
  const hiddenCount = isExpanded ? 0 : Math.max(0, replies.length - 1);
  const visibleReplies = hiddenCount > 0 ? replies.slice(-1) : replies;

  if (!first) return null;

  return (
    <article className="flex w-full flex-col gap-4 bg-white px-9 py-7">
      <header className="flex flex-wrap items-center gap-2.5">
        <span className="bg-brand grid size-6 place-items-center rounded-full rounded-bl-[4px] text-xs font-extrabold text-white">
          {pinNumber}
        </span>
        <h3 className="text-base font-extrabold">{pinNumber}번 요청</h3>
        <span className="ml-auto">
          <RequestStatusBadge label={CHANGE_REQUEST_STATUS_LABEL[status]} />
        </span>
        {projectId !== undefined && changeRequestId !== null && (
          <>
            <ChangeRequestStatusButtons
              size="sm"
              projectId={projectId}
              requestId={changeRequestId}
              status={status}
              role={role}
            />
            <ResolveRequestButtons
              size="sm"
              projectId={projectId}
              requestId={changeRequestId}
              status={status}
              role={role}
            />
          </>
        )}
      </header>

      <div className="flex flex-col gap-4">
        {[first, ...visibleReplies].map(({ id, authorName, authorRole, ...comment }, index) => (
          <div key={id} className="flex flex-col">
            {index === 1 && hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="bg-hover text-muted hover:text-ink mb-4 self-center rounded-full px-3 py-1 text-xs font-semibold"
              >
                답글 {hiddenCount}개 더 보기
              </button>
            )}
            <MessageItem
              {...comment}
              authorName={`${authorName} · ${PROJECT_ROLE_LABEL[authorRole]}`}
            />
          </div>
        ))}
      </div>
    </article>
  );
};

export default PinThreadCard;
