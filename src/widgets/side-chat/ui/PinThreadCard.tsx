'use client';

import { useState } from 'react';

import Image from 'next/image';

import { CHANGE_REQUEST_STATUS_LABEL, CHANGE_REQUEST_STATUSES } from '@/entities/request';

import progressActive from '../assets/progress-active.svg';
import progressInactive from '../assets/progress-inactive.svg';
import statusDot from '../assets/status-dot.svg';
import threadDivider from '../assets/thread-divider.svg';
import type { PinThread } from '../model/types';
import PinThreadComment from './PinThreadComment';

const PinThreadCard = ({ pinNumber, status, comments }: Omit<PinThread, 'id'>) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [first, ...replies] = comments;

  // 접힌 상태에서는 마지막 답글만 보여 주고 나머지는 "더 보기"로 묶습니다.
  const hiddenCount = isExpanded ? 0 : Math.max(0, replies.length - 1);
  const visibleReplies = hiddenCount > 0 ? replies.slice(-1) : replies;
  const step = CHANGE_REQUEST_STATUSES.indexOf(status) + 1;

  if (!first) return null;

  return (
    <article className="rounded-xlarge border-line-card flex w-full flex-col gap-3 border bg-white px-5 py-4">
      <header className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2 text-xs leading-[normal] font-medium">
          <span className="bg-surface-chip text-ink-500 rounded-full px-2 py-1">#{pinNumber}</span>
          <span className="bg-primary-faint text-primary-deep flex items-center gap-1 rounded-full px-2 py-1">
            <Image src={statusDot} alt="" unoptimized />
            {CHANGE_REQUEST_STATUS_LABEL[status]}
          </span>
        </div>
        <span
          role="img"
          aria-label={`진행 단계 ${step}/${CHANGE_REQUEST_STATUSES.length}`}
          className="flex gap-[3px]"
        >
          {CHANGE_REQUEST_STATUSES.map((value, index) => (
            <Image
              key={value}
              src={index < step ? progressActive : progressInactive}
              alt=""
              unoptimized
            />
          ))}
        </span>
      </header>

      <div className="flex w-full flex-col gap-4">
        <PinThreadComment {...first} />
        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="flex w-full items-center gap-4"
          >
            <Image src={threadDivider} alt="" unoptimized className="h-px min-w-0 flex-1" />
            <span className="text-ink-faint text-xs leading-[normal] font-medium whitespace-nowrap">
              답글 {hiddenCount}개 더 보기
            </span>
            <Image src={threadDivider} alt="" unoptimized className="h-px min-w-0 flex-1" />
          </button>
        )}
        {visibleReplies.map(({ id, ...reply }) => (
          <PinThreadComment key={id} {...reply} />
        ))}
      </div>
    </article>
  );
};

export default PinThreadCard;
