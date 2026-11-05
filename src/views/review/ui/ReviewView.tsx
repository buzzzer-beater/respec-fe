'use client';

import { useState } from 'react';

import { useGetMessages } from '@/entities/message';
import { useGetPinCommentsByPin } from '@/entities/pin';
import { useGetProject } from '@/entities/project';
import { useGetChangeRequests } from '@/entities/request';
import { useGetReviewRequest, useGetReviewRequests } from '@/entities/review';
import { formatRelativeTime } from '@/shared/lib';

import ReviewItemCard from './ReviewItemCard';

interface ReviewViewProps {
  projectId: number;
}

const isHttpsUrl = (value: string) => {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

const ReviewView = ({ projectId }: ReviewViewProps) => {
  // 고르지 않으면 최신 검수 제출을 보여 줍니다.
  const [selectedId, setSelectedId] = useState<number>();
  const reviews = useGetReviewRequests(projectId);
  const currentId = selectedId ?? reviews.data?.[0]?.id;
  const review = useGetReviewRequest(projectId, currentId);
  const { data: project } = useGetProject(projectId);

  // 요청 원문과 현재 상태를 보여 주려고 수정 요청, 핀 댓글, 채팅을 함께 받습니다.
  const requests = useGetChangeRequests(projectId, 'all');
  const messages = useGetMessages(projectId);
  const itemRequests = (review.data?.items ?? []).flatMap((item) => {
    const request = requests.data?.find((each) => each.id === item.change_request_id);
    return request ? [request] : [];
  });
  const commentsByPin = useGetPinCommentsByPin(projectId, [
    ...new Set(
      itemRequests.flatMap((request) => (request.pin_id === null ? [] : [request.pin_id])),
    ),
  ]);

  const getRequestContent = (changeRequestId: number) => {
    const request = itemRequests.find((each) => each.id === changeRequestId);
    if (!request) return undefined;
    if (request.pin_id !== null) {
      return commentsByPin
        .get(request.pin_id)
        ?.find((comment) => comment.id === request.source_pin_comment_id)?.content;
    }
    return messages.data?.find((message) => message.id === request.source_chat_message_id)?.content;
  };

  const deploymentUrl = review.data?.deployment_url;

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-white">
      <div className="flex flex-wrap items-center gap-4 px-10 pt-9 pb-6">
        <h1 className="text-[22px] font-extrabold">검수</h1>
        {reviews.data && reviews.data.length > 0 && (
          <label className="ml-auto flex items-center gap-2 text-sm">
            <span className="text-muted">검수 제출</span>
            <select
              value={currentId}
              onChange={(event) => setSelectedId(Number(event.target.value))}
              className="border-divider h-10 rounded-[10px] border bg-white px-3 font-semibold outline-none"
            >
              {reviews.data.map((summary, index) => (
                <option key={summary.id} value={summary.id}>
                  {index === 0 ? '최신 · ' : ''}
                  {formatRelativeTime(summary.created_at)} · 요청 {summary.item_count}건
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {reviews.isPending ? (
        <p className="text-muted px-10">검수 요청을 불러오고 있습니다.</p>
      ) : reviews.isError ? (
        <div role="alert" className="px-10">
          검수 요청을 불러오지 못했습니다.{' '}
          <button type="button" className="underline" onClick={() => reviews.refetch()}>
            다시 시도
          </button>
        </div>
      ) : reviews.data.length === 0 ? (
        <p className="bg-stage text-muted mx-10 rounded-2xl px-6 py-10 text-center text-sm">
          아직 검수 요청이 없습니다. 개발자가 반영을 마치고 검수를 요청하면 여기에 표시됩니다.
        </p>
      ) : review.isPending ? (
        <p className="text-muted px-10">검수 내용을 불러오고 있습니다.</p>
      ) : review.isError ? (
        <div role="alert" className="px-10">
          검수 내용을 불러오지 못했습니다.{' '}
          <button type="button" className="underline" onClick={() => review.refetch()}>
            다시 시도
          </button>
        </div>
      ) : (
        <div className="flex w-full max-w-[880px] flex-col gap-6 px-10 pb-10">
          {/* 외부 배포 사이트 미리보기 방식이 정해지기 전까지는 새 탭으로 엽니다. */}
          <section className="bg-stage flex flex-wrap items-center gap-4 rounded-2xl p-5">
            <div className="min-w-0 flex-1">
              <h2 className="text-muted text-xs font-semibold">검수할 배포 사이트</h2>
              <p className="mt-1 truncate font-semibold">
                {deploymentUrl ?? '배포 URL이 없습니다.'}
              </p>
            </div>
            {deploymentUrl && isHttpsUrl(deploymentUrl) && (
              <a
                href={deploymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-ink flex h-10 shrink-0 items-center rounded-[10px] px-4 text-sm font-bold text-white"
              >
                새 탭에서 열기
              </a>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-base font-extrabold">
              반영된 요청 <span className="text-muted text-sm">{review.data.items.length}</span>
            </h2>
            <ul className="flex flex-col gap-4">
              {review.data.items.map((item) => (
                <ReviewItemCard
                  key={item.change_request_id}
                  projectId={projectId}
                  item={item}
                  request={itemRequests.find((each) => each.id === item.change_request_id)}
                  requestContent={getRequestContent(item.change_request_id)}
                  role={project?.my_role}
                />
              ))}
            </ul>
          </section>
        </div>
      )}
    </main>
  );
};

export default ReviewView;
