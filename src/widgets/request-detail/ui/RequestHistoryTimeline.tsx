import { CHANGE_REQUEST_STATUS_LABEL, type ChangeRequestHistory } from '@/entities/request';
import { formatRelativeTime } from '@/shared/lib';

interface RequestHistoryTimelineProps {
  history: ChangeRequestHistory[];
  /** 변경한 사람 id → 표시 이름(이메일) */
  authorName: (userId: number) => string;
}

const describe = ({ from_status, to_status, review_request_id }: ChangeRequestHistory) => {
  if (from_status === null) return '요청 등록';
  const change = `${CHANGE_REQUEST_STATUS_LABEL[from_status]} → ${CHANGE_REQUEST_STATUS_LABEL[to_status]}`;
  if (from_status === 'pending_review' && to_status === 'open') return `재수정 요청 (${change})`;
  if (review_request_id !== null) return `검수 요청 (${change})`;
  return change;
};

/** 상태 이력. 오래된 순으로 위에서 아래로 보여 줍니다. */
const RequestHistoryTimeline = ({ history, authorName }: RequestHistoryTimelineProps) => {
  if (history.length === 0) {
    return <p className="text-muted text-sm">아직 기록이 없어요.</p>;
  }

  return (
    <ol className="flex flex-col">
      {history.map((item, index) => (
        <li key={`${item.created_at}-${index}`} className="relative flex gap-3 pb-5 last:pb-0">
          {/* 점과 세로선 */}
          <span className="relative flex w-2.5 shrink-0 justify-center">
            <span className="bg-ink relative z-10 mt-1.5 size-2.5 rounded-full" />
            {index < history.length - 1 && (
              <span className="bg-divider absolute top-4 -bottom-5 w-px" />
            )}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-ink text-sm font-semibold">{describe(item)}</p>
            <p className="text-muted text-xs">
              {authorName(item.changed_by)} ·{' '}
              <time dateTime={item.created_at} title={item.created_at}>
                {formatRelativeTime(item.created_at)}
              </time>
            </p>
            {item.reason && (
              <div className="bg-ai mt-1 flex flex-col gap-1 rounded-[10px] px-3 py-2.5">
                <p className="text-text text-xs font-bold">재수정 사유</p>
                <p className="text-text text-[13px] leading-relaxed wrap-anywhere whitespace-pre-wrap">
                  {item.reason}
                </p>
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
};

export default RequestHistoryTimeline;
