'use client';

import Link from 'next/link';

import { PinNumberBadge, type PinSource } from '@/entities/pin';
import { CHANGE_REQUEST_STATUS_LABEL, isMyTurn } from '@/entities/request';
import type { ProjectRole } from '@/entities/user';
import { Icon } from '@/shared/ui';

import { getNextActionLabel } from '../model/next-action';
import { splitThreadsByPage } from '../model/placement';
import type { PinThread } from '../model/types';

interface RequestListProps {
  /** 모든 요청(해결됨 포함). 해결된 요청은 `showResolved`일 때만 줄에 넣습니다. */
  threads: PinThread[];
  /** 지금 보는 사이트와 페이지. 경로를 모르면(`null`) 이 사이트의 요청을 모두 보여 줍니다. */
  site: PinSource;
  currentPath: string | null;
  showResolved: boolean;
  role?: ProjectRole;
  onSelect: (thread: PinThread) => void;
  /** "다른 페이지 요청 N개 보기"로 갈 주소 */
  otherPagesHref?: string;
}

const CALM_TEXT: Record<ProjectRole, string> = {
  developer: '지금 이 페이지에는 할 일이 없어요.',
  client: '지금은 개발자 차례예요. 답이 오면 여기에 먼저 보여 드릴게요.',
};

/**
 * 오른쪽 패널의 요청 목록 (demo-design `renderList`).
 * 이 페이지 요청 N → "지금 할 일" 카드 1개(내 차례 중 첫 번째, 없으면 안내 상자) → 나머지 한 줄씩
 * → 다른 페이지 요청 N개 보기
 */
const RequestList = ({
  threads,
  site,
  currentPath,
  showResolved,
  role,
  onSelect,
  otherPagesHref,
}: RequestListProps) => {
  const { here, elsewhere } = splitThreadsByPage(threads, site, currentPath);
  const open = here.filter(({ thread }) => thread.status !== 'resolved');
  const focus = open.find(({ thread }) => isMyTurn(thread.status, role))?.thread;
  const rest = (showResolved ? here : open).filter(({ thread }) => thread !== focus);
  const focusAction = focus ? getNextActionLabel(focus.status, role) : null;

  return (
    <div>
      <h2 className="mb-5 text-xl font-extrabold">
        이 페이지 요청 <em className="text-muted not-italic">{open.length}</em>
      </h2>

      {focus ? (
        <button
          type="button"
          onClick={() => onSelect(focus)}
          className="bg-brand-soft ease-spring grid w-full gap-3 rounded-[14px] p-[18px] text-left transition-transform duration-300 hover:-translate-y-0.5"
        >
          <span className="text-brand text-[13px] font-extrabold">지금 할 일</span>
          <span className="flex gap-2.5">
            <PinNumberBadge number={focus.pinNumber} filled />
            <span className="text-ink line-clamp-2 text-base leading-normal font-bold wrap-anywhere">
              {focus.title}
            </span>
          </span>
          {focusAction && (
            <span className="text-brand flex items-center justify-between text-sm font-bold">
              {focusAction}
              <Icon name="right" size={16} />
            </span>
          )}
        </button>
      ) : (
        <p className="bg-hover text-muted rounded-[14px] p-[18px] text-sm leading-[1.6]">
          {CALM_TEXT[role ?? 'client']}
        </p>
      )}

      {rest.length > 0 && (
        <ul className="mt-3 flex flex-col">
          {rest.map(({ thread, byReview }) => (
            <li key={thread.id} className="border-divider border-b last:border-b-0">
              <button
                type="button"
                onClick={() => onSelect(thread)}
                className="group flex h-14 w-full items-center gap-3 px-1 text-left"
              >
                <PinNumberBadge number={thread.pinNumber} done={thread.status === 'resolved'} />
                <span className="text-ink min-w-0 flex-1 truncate text-[15px] font-medium underline-offset-[3px] group-hover:underline">
                  {thread.title}
                </span>
                {byReview && (
                  <span className="bg-hover text-text shrink-0 rounded-full px-[7px] py-0.5 text-[11px] font-bold">
                    반영 위치
                  </span>
                )}
                <span className="text-muted shrink-0 text-[13px]">
                  {CHANGE_REQUEST_STATUS_LABEL[thread.status]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {here.length === 0 && (
        <p className="bg-ai text-muted mt-4 rounded-xl p-4 text-center text-sm">
          {site === 'deployment'
            ? '배포본의 이 페이지에는 아직 핀이 없어요.'
            : '이 페이지에는 아직 핀이 없어요.'}
        </p>
      )}

      {elsewhere > 0 && otherPagesHref && (
        <Link
          href={otherPagesHref}
          className="bg-hover text-text hover:text-ink mt-4 flex items-center justify-between rounded-xl px-4 py-3.5 text-sm font-semibold transition-colors"
        >
          다른 페이지 요청 {elsewhere}개 보기
          <Icon name="right" size={14} />
        </Link>
      )}
    </div>
  );
};

export default RequestList;
