'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useGetMessages } from '@/entities/message';
import {
  PIN_SOURCE_LABEL,
  type PinSource,
  toPageLabel,
  toPinNumbers,
  useGetPinCommentsByPin,
  useGetPins,
} from '@/entities/pin';
import { useGetProject } from '@/entities/project';
import {
  CHANGE_REQUEST_STATUS_LABEL,
  CHANGE_REQUEST_STATUSES,
  CHANGE_REQUEST_TURN_LABEL,
  isMyTurn,
  useGetChangeRequests,
} from '@/entities/request';
import { can, PROJECT_ROLE_LABEL } from '@/entities/user';
import { ChangeRequestStatusButtons } from '@/features/change-request-status';
import { cn } from '@/shared/lib';
import { buttonClassName, Dropdown, Icon, Switch } from '@/shared/ui';

type SiteFilter = 'all' | PinSource;

const SITE_OPTIONS = [
  { value: 'all', label: '모든 사이트' },
  { value: 'draft', label: PIN_SOURCE_LABEL.draft },
  { value: 'deployment', label: PIN_SOURCE_LABEL.deployment },
] as const;

interface RequestBoardViewProps {
  projectId: number;
}

/**
 * demo-design `requests.html`. 모든 요청을 단계별 5칸 보드로 봅니다.
 * 카드를 누르면 작업 화면의 그 핀으로 갑니다. 핀이 없는 채팅 요청은 작업 화면으로만 갑니다.
 */
const RequestBoardView = ({ projectId }: RequestBoardViewProps) => {
  const router = useRouter();
  const [search, setSearch] = useState('');
  // "내 차례만": 지금 내가 움직일 요청만 봅니다.
  const [mineOnly, setMineOnly] = useState(false);
  const [site, setSite] = useState<SiteFilter>('all');
  const { data: project } = useGetProject(projectId);
  const role = project?.my_role;
  const requests = useGetChangeRequests(projectId, 'all');
  const pins = useGetPins(projectId);
  const messages = useGetMessages(projectId);
  const commentsByPin = useGetPinCommentsByPin(projectId, [
    ...new Set(
      (requests.data ?? []).flatMap((request) => (request.pin_id === null ? [] : [request.pin_id])),
    ),
  ]);
  const pinNumbers = toPinNumbers(pins.data ?? []);
  const query = search.trim().toLowerCase();
  const viewerHref = `/projects/${projectId}/viewer`;

  const cards = (requests.data ?? [])
    .map((request) => {
      const pin = pins.data?.find((item) => item.id === request.pin_id);
      const message = messages.data?.find((item) => item.id === request.source_chat_message_id);
      const comment =
        request.pin_id === null
          ? undefined
          : commentsByPin
              .get(request.pin_id)
              ?.find((item) => item.id === request.source_pin_comment_id);
      const text =
        comment?.content ?? message?.content ?? request.ai_summary ?? `요청 #${request.id}`;
      const siteLabel = request.source ? PIN_SOURCE_LABEL[request.source] : null;
      const where = pin
        ? [siteLabel, toPageLabel(pin.page_path)].filter(Boolean).join(' · ')
        : [siteLabel, '채팅에서 등록 · 위치 없음'].filter(Boolean).join(' · ');
      return {
        ...request,
        text,
        where,
        pinNumber: request.pin_id === null ? null : (pinNumbers.get(request.pin_id) ?? null),
        mine: isMyTurn(request.status, role),
        href: request.pin_id === null ? viewerHref : `${viewerHref}#pin-${request.pin_id}`,
      };
    })
    .filter((request) => !mineOnly || request.mine)
    .filter((request) => site === 'all' || request.source === site)
    .filter((request) => !query || request.text.toLowerCase().includes(query));
  const all = requests.data ?? [];
  const openCount = all.filter((request) => request.status !== 'resolved').length;
  const mineCount = all.filter((request) => isMyTurn(request.status, role)).length;
  const workingCount = all.filter((request) => request.status === 'in_progress').length;

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
      <title>RE:SPEC — 요청 관리</title>
      <div className="flex flex-wrap items-center gap-3.5 px-10 pt-9 pb-6">
        <h2 className="text-[22px] font-extrabold">요청 관리</h2>
        <span className="text-muted text-sm">
          진행 중 <b className="text-ink">{openCount}</b> ·{' '}
          {role ? `${PROJECT_ROLE_LABEL[role]}인 ` : ''}내 차례{' '}
          <b className="text-ink">{mineCount}</b>
        </span>
        <span className="flex-1" />
        <Switch checked={mineOnly} onCheckedChange={setMineOnly}>
          내 차례만
        </Switch>
        <Dropdown
          value={site}
          options={SITE_OPTIONS}
          onChange={setSite}
          label="사이트"
          triggerClassName="h-10 shadow-[inset_0_0_0_1px_var(--color-divider)]"
        />
        {/* 검수 요청은 배포본에 반영 위치를 찍어야 해서 작업 화면에서 묶어 보냅니다. */}
        {can(role, 'request-review') && (
          <Link
            href={`${viewerHref}?review=1`}
            className={buttonClassName({ size: 'sm', className: 'shrink-0' })}
          >
            {workingCount > 0 ? `검수 요청 만들기 · ${workingCount}` : '검수 요청 만들기'}
          </Link>
        )}
        <label className="border-divider text-muted focus-within:border-ink flex h-10 w-[260px] items-center gap-2 rounded-[10px] border px-3">
          <Icon name="search" size={15} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="요청 검색"
            aria-label="요청 검색"
            className="text-ink min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </label>
      </div>
      {requests.isPending ? (
        <p className="text-muted px-10">요청을 불러오고 있어요.</p>
      ) : requests.isError ? (
        <div role="alert" className="px-10">
          요청을 불러오지 못했어요.{' '}
          <button type="button" className="underline" onClick={() => requests.refetch()}>
            다시 시도
          </button>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-[repeat(5,minmax(230px,1fr))] gap-4 overflow-x-auto px-10 pt-2 pb-10">
          {CHANGE_REQUEST_STATUSES.map((status) => {
            const column = cards.filter((request) => request.status === status);
            return (
              <section
                key={status}
                aria-label={CHANGE_REQUEST_STATUS_LABEL[status]}
                className="bg-stage flex min-h-0 flex-col rounded-2xl"
              >
                <div className="flex items-center gap-2 px-5 pt-5 pb-3.5">
                  <h3 className="text-base font-extrabold">
                    {CHANGE_REQUEST_STATUS_LABEL[status]}
                  </h3>
                  <span className="text-muted text-sm font-bold">{column.length}</span>
                  <span className="text-faint ml-auto text-xs font-semibold">
                    {CHANGE_REQUEST_TURN_LABEL[status]}
                  </span>
                </div>
                <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-3 pb-3">
                  {column.length === 0 && (
                    <p className="text-faint px-2 py-6 text-center text-[13px]">비어 있어요</p>
                  )}
                  {column.map((request, index) => {
                    const isDone = request.status === 'resolved';
                    const showReviewLink = role === 'client' && request.status === 'pending_review';
                    return (
                      <article
                        key={request.id}
                        style={{ animationDelay: `${index * 40}ms` }}
                        onClick={() => router.push(request.href)}
                        className={cn(
                          'grid animate-[pop-in_0.35s_var(--ease-out-soft)_backwards] cursor-pointer gap-2.5 rounded-xl bg-white p-[18px] shadow-[0_1px_2px_rgba(24,24,27,0.06)] transition-shadow duration-200 hover:shadow-[0_6px_18px_rgba(24,24,27,0.1)]',
                          isDone && 'opacity-60',
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {request.pinNumber !== null && (
                            <span
                              className={cn(
                                'grid size-[26px] shrink-0 place-items-center rounded-[50%_50%_50%_5px] text-xs font-extrabold',
                                isDone ? 'bg-faint text-white' : 'bg-brand-soft text-brand',
                              )}
                            >
                              {request.pinNumber}
                            </span>
                          )}
                          <span className="text-muted truncate text-xs font-semibold">
                            {request.where}
                          </span>
                          {request.mine && (
                            <span className="text-ink ml-auto inline-flex shrink-0 items-center gap-[5px] text-xs font-bold whitespace-nowrap">
                              <span aria-hidden className="bg-alert size-1.5 rounded-full" />내 차례
                            </span>
                          )}
                        </div>
                        {/* 키보드로도 열 수 있게 본문을 링크로 둡니다. */}
                        <Link
                          href={request.href}
                          onClick={(event) => event.stopPropagation()}
                          className="text-ink line-clamp-3 text-[15px] leading-normal font-semibold focus-visible:outline-offset-4"
                        >
                          {request.text}
                        </Link>
                        {/* 카드마다 반복되는 결정 버튼은 외곽선으로 둡니다. 검정은 위쪽 "검수 요청 만들기" 하나입니다. */}
                        {request.mine && (
                          <div
                            className="flex flex-wrap items-center justify-end gap-2"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <ChangeRequestStatusButtons
                              size="sm"
                              variant="secondary"
                              projectId={projectId}
                              requestId={request.id}
                              status={request.status}
                              role={role}
                              pinNumber={request.pinNumber}
                            />
                            {can(role, 'request-review') && request.status === 'in_progress' && (
                              <Link
                                href={`${viewerHref}?review=1&pick=${request.id}`}
                                className={buttonClassName({ variant: 'secondary', size: 'sm' })}
                              >
                                검수 요청에 담기
                              </Link>
                            )}
                            {showReviewLink && (
                              <Link
                                href={request.href}
                                className={buttonClassName({ variant: 'secondary', size: 'sm' })}
                              >
                                검수하러 가기
                              </Link>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
};

export default RequestBoardView;
