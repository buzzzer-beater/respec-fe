'use client';

import { useState } from 'react';

import { useGetMessages } from '@/entities/message';
import { useGetPinCommentsByPin, useGetPins } from '@/entities/pin';
import { useGetProject } from '@/entities/project';
import {
  CHANGE_REQUEST_STATUS_LABEL,
  CHANGE_REQUEST_STATUSES,
  useGetChangeRequests,
} from '@/entities/request';
import { RequestReviewButton } from '@/features/request-review';
import { RequestDetailDrawer } from '@/widgets/request-detail';

interface RequestBoardViewProps {
  projectId: number;
}

const RequestBoardView = ({ projectId }: RequestBoardViewProps) => {
  const [search, setSearch] = useState('');
  const [myTurnOnly, setMyTurnOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const project = useGetProject(projectId);
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
      const isMyTurn =
        project.data?.my_role === 'developer'
          ? request.status === 'open' ||
            request.status === 'reviewing' ||
            request.status === 'in_progress'
          : request.status === 'pending_review';
      return { ...request, pin, title, isMyTurn };
    })
    .filter(
      (request) =>
        (!query || request.title.toLowerCase().includes(query)) &&
        (!myTurnOnly || request.isMyTurn),
    );

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
      <div className="flex flex-wrap items-center gap-4 px-10 pt-9 pb-6">
        <h1 className="text-[22px] font-extrabold">요청 관리</h1>
        <p className="text-muted text-sm">
          전체 <strong className="text-ink">{requests.data?.length ?? 0}</strong>건
        </p>
        <label className="border-divider focus-within:border-ink ml-auto flex h-10 w-[260px] items-center rounded-[10px] border px-3 transition-colors">
          <span className="sr-only">요청 검색</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="요청 검색"
            className="min-w-0 flex-1 outline-none"
          />
        </label>
        <button
          type="button"
          aria-pressed={myTurnOnly}
          onClick={() => setMyTurnOnly((value) => !value)}
          className={`h-10 rounded-full border px-3.5 text-sm font-semibold ${myTurnOnly ? 'border-ink bg-ink text-white' : 'border-divider text-text hover:border-ink bg-white'}`}
        >
          내 차례만
        </button>
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
                <h2 className="px-5 pt-5 pb-3.5 text-base font-extrabold">
                  {CHANGE_REQUEST_STATUS_LABEL[status]}{' '}
                  <span className="text-muted text-sm">{column.length}</span>
                </h2>
                <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-3 pb-3">
                  {column.length === 0 && (
                    <p className="text-faint py-6 text-center text-sm">요청이 없습니다.</p>
                  )}
                  {column.map((request) => (
                    <button
                      key={request.id}
                      type="button"
                      onClick={() => setSelectedId(request.id)}
                      className={`block rounded-xl bg-white p-[18px] text-left shadow-sm transition-shadow hover:shadow-md focus-visible:-outline-offset-2 ${request.isMyTurn ? 'border-divider border' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-muted truncate text-xs">
                          {request.pin ? request.pin.page_path : '위치 없음'}
                        </p>
                        {request.isMyTurn && (
                          <span className="text-warn flex shrink-0 items-center gap-1.5 text-xs font-bold">
                            <i className="bg-warn size-2 rounded-full" />내 차례
                          </span>
                        )}
                      </div>
                      <p className="mt-2.5 line-clamp-3 text-[15px] font-semibold">
                        {request.title}
                      </p>
                      <p className="text-muted mt-3 text-xs">
                        요청 #{request.id} ·{' '}
                        {request.source_pin_comment_id !== null ? '핀' : '채팅'}
                      </p>
                    </button>
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
