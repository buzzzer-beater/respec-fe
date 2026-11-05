import Link from 'next/link';

import {
  CHANGE_REQUEST_STATUS_LABEL,
  type ChangeRequest,
  RequestStatusBadge,
} from '@/entities/request';
import type { ReviewItem } from '@/entities/review';
import type { ProjectRole } from '@/entities/user';
import { ResolveRequestButtons } from '@/features/resolve-request';
import { PlainTextExplanation } from '@/shared/ui';

interface ReviewItemCardProps {
  projectId: number;
  item: ReviewItem;
  /** 아직 받지 못했으면 없습니다. */
  request?: ChangeRequest;
  /** 고객이 쓴 요청 원문 (핀 댓글 또는 채팅 메시지) */
  requestContent?: string | null;
  role?: ProjectRole;
}

const ReviewItemCard = ({
  projectId,
  item,
  request,
  requestContent,
  role,
}: ReviewItemCardProps) => {
  const summary = request?.ai_summary ?? null;
  const pinHref =
    request?.pin_id != null && request.status !== 'resolved'
      ? `/projects/${projectId}/viewer#pin-${request.pin_id}`
      : null;

  const requestBody = requestContent ? (
    <PlainTextExplanation
      original={requestContent}
      plainText={summary}
      originalLabel="요청 원문"
      plainTextLabel="AI 정리"
    />
  ) : (
    <p className="text-ink text-[15px] font-semibold">
      {summary ?? `요청 #${item.change_request_id}`}
    </p>
  );

  return (
    <li className="border-divider rounded-2xl border bg-white p-5">
      <div className="flex items-center gap-2">
        <span className="text-muted text-xs">요청 #{item.change_request_id}</span>
        {request && <RequestStatusBadge label={CHANGE_REQUEST_STATUS_LABEL[request.status]} />}
      </div>

      <div className="mt-3">
        {pinHref ? (
          <Link href={pinHref} className="hover:bg-hover -m-2 block rounded-xl p-2">
            {requestBody}
            <span className="text-muted mt-2 block text-xs font-bold">화면에서 핀 보기 →</span>
          </Link>
        ) : (
          requestBody
        )}
      </div>

      <div className="border-divider mt-4 border-t pt-4">
        <h3 className="mb-2 text-sm font-bold">반영 설명</h3>
        <PlainTextExplanation
          original={item.implementation_note}
          plainText={item.ai_plain_text}
          originalLabel="개발자 원문"
          plainTextLabel="AI 쉬운 설명"
        />
      </div>

      {/* 고객에게만, 검수 대기일 때만 보입니다. */}
      {request && (
        <div className="mt-4 flex justify-end">
          <ResolveRequestButtons
            projectId={projectId}
            requestId={request.id}
            status={request.status}
            role={role}
          />
        </div>
      )}
    </li>
  );
};

export default ReviewItemCard;
