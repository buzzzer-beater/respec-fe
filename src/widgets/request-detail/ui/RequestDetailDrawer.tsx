'use client';

import Link from 'next/link';

import type { ReactNode } from 'react';

import { useGetMessages } from '@/entities/message';
import { useGetPinCommentsByPin, useGetPins } from '@/entities/pin';
import { useGetProject, useGetProjectMembers } from '@/entities/project';
import {
  CHANGE_REQUEST_STATUS_LABEL,
  RequestStatusBadge,
  useGetChangeRequest,
  useGetChangeRequestHistory,
} from '@/entities/request';
import { ChangeRequestStatusButtons } from '@/features/change-request-status';
import { ResolveRequestButtons } from '@/features/resolve-request';
import { Dialog, DialogClose, DialogTitle, PlainTextExplanation } from '@/shared/ui';

import RequestHistoryTimeline from './RequestHistoryTimeline';

interface RequestDetailDrawerProps {
  projectId: number;
  requestId: number;
  onClose: () => void;
}

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="flex flex-col gap-3">
    <h3 className="text-muted text-xs font-bold">{title}</h3>
    {children}
  </section>
);

/** 수정 요청 상세. 오른쪽 드로어로 열리고 Esc와 바깥 클릭으로 닫힙니다. */
const RequestDetailDrawer = ({ projectId, requestId, onClose }: RequestDetailDrawerProps) => {
  const { data: project } = useGetProject(projectId);
  const { data: members = [] } = useGetProjectMembers(projectId);
  const { data: pins = [] } = useGetPins(projectId);
  const messages = useGetMessages(projectId);
  const detail = useGetChangeRequest(projectId, requestId);
  const history = useGetChangeRequestHistory(projectId, requestId);
  const request = detail.data;
  const commentsByPin = useGetPinCommentsByPin(
    projectId,
    request?.pin_id != null && request.source_pin_comment_id !== null ? [request.pin_id] : [],
  );

  const emails = new Map(members.map((member) => [member.id, member.email]));
  const authorName = (userId: number) => emails.get(userId) ?? '참여자';

  const pin = pins.find((item) => item.id === request?.pin_id);
  const sourceComment =
    request?.pin_id != null
      ? commentsByPin.get(request.pin_id)?.find((item) => item.id === request.source_pin_comment_id)
      : undefined;
  const sourceMessage = messages.data?.find((item) => item.id === request?.source_chat_message_id);
  const original = sourceComment?.content ?? sourceMessage?.content ?? null;
  const isSourcePending =
    request?.source_pin_comment_id != null
      ? request.pin_id != null && !commentsByPin.has(request.pin_id)
      : messages.isPending;

  return (
    <Dialog side="right" onClose={onClose}>
      <div className="flex h-full flex-col">
        <header className="border-divider flex items-center gap-2.5 border-b px-7 py-5">
          <DialogTitle>요청 #{requestId}</DialogTitle>
          {request && (
            <RequestStatusBadge
              label={CHANGE_REQUEST_STATUS_LABEL[request.status]}
              status={request.status}
            />
          )}
          <DialogClose className="ml-auto size-9 rounded-lg text-xl" />
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto px-7 py-6">
          {!request ? (
            detail.isError ? (
              <div role="alert" className="text-sm">
                요청을 불러오지 못했습니다.{' '}
                <button type="button" className="underline" onClick={() => detail.refetch()}>
                  다시 시도
                </button>
              </div>
            ) : (
              <p className="text-muted text-sm">요청을 불러오고 있습니다.</p>
            )
          ) : (
            <>
              <p className="text-muted text-xs">
                {request.pin_id !== null
                  ? `핀 · ${pin?.page_path ?? '위치 확인 중'}`
                  : '채팅에서 등록한 요청'}
              </p>

              <Section title="요청 내용">
                {original !== null ? (
                  <PlainTextExplanation
                    original={original}
                    plainText={request.ai_summary}
                    plainTextLabel="AI 정리"
                  />
                ) : isSourcePending ? (
                  <p className="text-muted text-sm">원문을 불러오고 있습니다.</p>
                ) : (
                  <PlainTextExplanation
                    original="원문을 찾지 못했어요."
                    plainText={request.ai_summary}
                    plainTextLabel="AI 정리"
                    className="text-muted"
                  />
                )}
              </Section>

              {request.latest_review_item && (
                <Section title="최근 반영 설명">
                  <PlainTextExplanation
                    original={request.latest_review_item.implementation_note}
                    plainText={request.latest_review_item.ai_plain_text}
                  />
                </Section>
              )}

              <Section title="상태 이력">
                {history.isPending ? (
                  <p className="text-muted text-sm">이력을 불러오고 있습니다.</p>
                ) : history.isError ? (
                  <div role="alert" className="text-sm">
                    이력을 불러오지 못했습니다.{' '}
                    <button type="button" className="underline" onClick={() => history.refetch()}>
                      다시 시도
                    </button>
                  </div>
                ) : (
                  <RequestHistoryTimeline history={history.data} authorName={authorName} />
                )}
              </Section>
            </>
          )}
        </div>

        {request && (
          <footer className="border-divider flex flex-wrap items-center gap-2 border-t px-7 py-5">
            {request.pin_id !== null && (
              <Link
                href={`/projects/${projectId}/viewer#pin-${request.pin_id}`}
                className="text-ink text-sm font-semibold underline-offset-4 hover:underline"
              >
                핀으로 이동
              </Link>
            )}
            <div className="ml-auto flex flex-wrap justify-end gap-2">
              <ChangeRequestStatusButtons
                projectId={projectId}
                requestId={request.id}
                status={request.status}
                role={project?.my_role}
              />
              <ResolveRequestButtons
                projectId={projectId}
                requestId={request.id}
                status={request.status}
                role={project?.my_role}
              />
            </div>
          </footer>
        )}
      </div>
    </Dialog>
  );
};

export default RequestDetailDrawer;
