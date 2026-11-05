'use client';

import Link from 'next/link';

import { CHANGE_REQUEST_STATUS_LABEL, isMyTurn } from '@/entities/request';
import type { ProjectRole } from '@/entities/user';
import { cn } from '@/shared/lib';

import { getNextActionLabel } from '../model/next-action';
import type { PinThread } from '../model/types';

const PinNumber = ({ number, inverted = false }: { number: number; inverted?: boolean }) => (
  <span
    className={cn(
      'grid size-6 shrink-0 place-items-center rounded-full rounded-bl-[4px] text-xs font-extrabold',
      inverted ? 'text-brand bg-white' : 'bg-brand-soft text-brand',
    )}
  >
    {number}
  </span>
);

const threadTitle = (thread: PinThread) =>
  thread.preview?.trim() || thread.comments[0]?.content || `${thread.pinNumber}번 요청`;

interface PageRequestListProps {
  /** 모든 페이지의 요청 스레드. "완료 보기"를 끄면 해결된 요청은 빠져 있습니다. */
  threads: PinThread[];
  /** 지금 보고 있는 페이지. 모르면(`null`) 모든 요청을 이 페이지 요청으로 봅니다. */
  currentPath: string | null;
  role?: ProjectRole;
  onSelect: (thread: PinThread) => void;
  /** "다른 페이지 요청 N개 보기"로 갈 주소 */
  otherPagesHref?: string;
}

/**
 * 오른쪽 패널의 요청 목록: 이 페이지 요청 N → "지금 할 일" 카드 1개(내 차례 중 첫 번째)
 * → 나머지 한 줄씩 → 다른 페이지 요청 N개 보기
 */
const PageRequestList = ({
  threads,
  currentPath,
  role,
  onSelect,
  otherPagesHref,
}: PageRequestListProps) => {
  const isHere = (thread: PinThread) => currentPath === null || thread.pagePath === currentPath;
  const here = threads.filter(isHere);
  const openHere = here.filter((thread) => thread.status !== 'resolved');
  const focus = openHere.find((thread) => isMyTurn(thread.status, role));
  const rest = here.filter((thread) => thread !== focus);
  const elsewhere = threads.filter(
    (thread) => !isHere(thread) && thread.status !== 'resolved',
  ).length;
  const focusAction = focus ? getNextActionLabel(focus.status, role) : null;

  return (
    <div className="flex flex-col gap-4 px-9 py-7">
      <h2 className="text-lg font-extrabold">
        이 페이지 요청 <span className="text-brand ml-0.5">{openHere.length}</span>
      </h2>

      {focus ? (
        <button
          type="button"
          onClick={() => onSelect(focus)}
          className="bg-brand flex flex-col gap-3 rounded-2xl p-4 text-left text-white transition-transform active:scale-[0.98]"
        >
          <span className="text-xs font-bold opacity-80">지금 할 일</span>
          <span className="flex items-start gap-2.5">
            <PinNumber number={focus.pinNumber} inverted />
            <span className="line-clamp-2 text-[15px] leading-snug font-semibold wrap-anywhere">
              {threadTitle(focus)}
            </span>
          </span>
          {focusAction && (
            <span className="flex items-center justify-between text-sm font-bold">
              {focusAction}
              <span aria-hidden>›</span>
            </span>
          )}
        </button>
      ) : (
        openHere.length > 0 && (
          <p className="bg-stage text-text rounded-xl px-4 py-3 text-sm leading-relaxed">
            {role === 'developer'
              ? '지금 이 페이지에는 할 일이 없어요.'
              : '지금은 개발자 차례예요. 답이 오면 여기에 먼저 보여 드릴게요.'}
          </p>
        )
      )}

      {rest.length > 0 && (
        <ul className="divide-divider -mx-2 flex flex-col divide-y">
          {rest.map((thread) => {
            const mine = isMyTurn(thread.status, role);
            return (
              <li key={thread.id}>
                <button
                  type="button"
                  onClick={() => onSelect(thread)}
                  className={cn(
                    'hover:bg-hover flex w-full items-center gap-2.5 rounded-lg px-2 py-3 text-left',
                    thread.status === 'resolved' && 'opacity-60',
                  )}
                >
                  <PinNumber number={thread.pinNumber} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {threadTitle(thread)}
                  </span>
                  {mine && (
                    <span className="text-alert flex shrink-0 items-center gap-1 text-xs font-bold">
                      <span aria-hidden className="bg-alert size-1.5 rounded-full" />내 차례
                    </span>
                  )}
                  <span className="text-muted shrink-0 text-xs">
                    {CHANGE_REQUEST_STATUS_LABEL[thread.status]}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {here.length === 0 && (
        <p className="text-muted text-sm leading-relaxed">
          이 페이지에는 아직 핀이 없어요. 핀 모드에서 사이트를 눌러 요청을 남겨 보세요.
        </p>
      )}

      {elsewhere > 0 && otherPagesHref && (
        <Link
          href={otherPagesHref}
          className="text-text hover:text-ink flex items-center gap-1 self-start text-sm font-semibold underline underline-offset-4"
        >
          다른 페이지 요청 {elsewhere}개 보기
          <span aria-hidden>›</span>
        </Link>
      )}
    </div>
  );
};

export default PageRequestList;
