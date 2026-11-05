'use client';

import { useState } from 'react';

import Link from 'next/link';

import { useGetMessages } from '@/entities/message';
import { useGetPinCommentsByPin, useGetPins } from '@/entities/pin';
import { useGetProject } from '@/entities/project';
import {
  CHANGE_REQUEST_STATUS_LABEL,
  CHANGE_REQUEST_STATUSES,
  CHANGE_REQUEST_TURN_LABEL,
  isMyTurn,
  useGetChangeRequests,
} from '@/entities/request';
import { ChangeRequestStatusButtons } from '@/features/change-request-status';
import { AddToReviewButton, RequestReviewButton } from '@/features/request-review';
import { buttonClassName } from '@/shared/ui';
import { RequestDetailDrawer } from '@/widgets/request-detail';

interface RequestBoardViewProps {
  projectId: number;
}

const RequestBoardView = ({ projectId }: RequestBoardViewProps) => {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // "내 차례만": 지금 내가 움직일 요청만 봅니다.
  const [mineOnly, setMineOnly] = useState(false);
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
  const query = search.trim().toLowerCase();

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
      const title =
        comment?.content ?? message?.content ?? request.ai_summary ?? `요청 #${request.id}`;
      return { ...request, pin, title, mine: isMyTurn(request.status, role) };
    })
    .filter((request) => !query || request.title.toLowerCase().includes(query))
    .filter((request) => !mineOnly || request.mine);
  const all = requests.data ?? [];
  const openCount = all.filter((request) => request.status !== 'resolved').length;
  const mineCount = all.filter((request) => isMyTurn(request.status, role)).length;

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
      <div className="flex flex-wrap items-center gap-4 px-10 pt-9 pb-6">
        <h1 className="text-[22px] font-extrabold">요청 관리</h1>
        <p className="text-muted text-sm">
          진행 중 <strong className="text-ink">{openCount}</strong> · 내 차례{' '}
          <strong className="text-alert">{mineCount}</strong>
        </p>
        <button
          type="button"
          onClick={() => setMineOnly((value) => !value)}
          aria-pressed={mineOnly}
          className="border-divider text-text hover:bg-hover aria-pressed:border-brand aria-pressed:bg-brand-soft aria-pressed:text-brand ml-auto h-10 rounded-[10px] border px-3.5 text-sm font-semibold whitespace-nowrap"
        >
          내 차례만
        </button>
        <label className="border-divider focus-within:border-ink flex h-10 w-[260px] items-center rounded-[10px] border px-3 transition-colors">
          <span className="sr-only">요청 검색</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="요청 검색"
            className="min-w-0 flex-1 outline-none"
          />
        </label>
        <RequestReviewButton projectId={projectId} requests={requests.data ?? []} />
      </div>
      {requests.isPending ? (
        <p className="text-muted px-10">요청을 불러오고 있습니다.</p>
      ) : requests.isError ? (
        <div role="alert" className="px-10">
          요청을 불러오지 못했습니다.{' '}
          <button type="button" className="underline" onClick={() => requests.refetch()}>
            다시 시도
          </button>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-[repeat(5,minmax(230px,1fr))] gap-4 overflow-x-auto px-10 pb-10">
          {CHANGE_REQUEST_STATUSES.map((status) => {
            const column = cards.filter((request) => request.status === status);
            return (
              <section key={status} className="bg-stage flex min-h-0 flex-col rounded-2xl">
                <h2 className="flex items-baseline gap-1.5 px-5 pt-5 pb-3.5 text-base font-extrabold">
                  {CHANGE_REQUEST_STATUS_LABEL[status]}
                  <span className="text-muted text-sm">{column.length}</span>
                  <span className="text-muted ml-auto text-xs font-semibold">
                    {CHANGE_REQUEST_TURN_LABEL[status]}
                  </span>
                </h2>
                <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-3 pb-3">
                  {column.length === 0 && (
                    <p className="text-faint py-6 text-center text-sm">
                      {mineOnly ? '내 차례인 요청이 없어요.' : '비어 있어요.'}
                    </p>
                  )}
                  {column.map((request) => (
                    // 카드 안에 결정 버튼이 있어서 카드 전체가 아니라 본문만 버튼으로 둡니다.
                    <article
                      key={request.id}
                      className="rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedId(request.id)}
                        className="block w-full rounded-xl p-[18px] text-left focus-visible:-outline-offset-2"
                      >
                        <p className="text-muted flex items-center gap-2 text-xs">
                          <span className="truncate">
                            {request.pin ? request.pin.page_path : '채팅에서 등록 · 위치 없음'}
                          </span>
                          {request.mine && (
                            <span className="text-alert ml-auto flex shrink-0 items-center gap-1 font-bold">
                              <span aria-hidden className="bg-alert size-1.5 rounded-full" />내 차례
                            </span>
                          )}
                        </p>
                        <p className="mt-2.5 line-clamp-3 text-[15px] font-semibold">
                          {request.title}
                        </p>
                        <p className="text-muted mt-3 text-xs">
                          요청 #{request.id} ·{' '}
                          {request.source_pin_comment_id !== null ? '핀' : '채팅'}
                        </p>
                      </button>
                      {/* 카드마다 반복되는 결정 버튼은 외곽선으로 둡니다. 검정은 위쪽 "검수 요청 만들기" 하나입니다. */}
                      {request.mine && (
                        <div className="flex flex-wrap justify-end gap-1.5 px-[18px] pb-[18px]">
                          <ChangeRequestStatusButtons
                            size="sm"
                            variant="secondary"
                            projectId={projectId}
                            requestId={request.id}
                            status={request.status}
                            role={role}
                          />
                          <AddToReviewButton
                            size="sm"
                            variant="secondary"
                            projectId={projectId}
                            requestId={request.id}
                            status={request.status}
                            role={role}
                          />
                          {role === 'client' && request.status === 'pending_review' && (
                            <Link
                              href={`/projects/${projectId}/review`}
                              className={buttonClassName({ variant: 'secondary', size: 'sm' })}
                            >
                              검수하러 가기
                            </Link>
                          )}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
      {selectedId !== null && (
        <RequestDetailDrawer
          projectId={projectId}
          requestId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </main>
  );
};

export default RequestBoardView;
