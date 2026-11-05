'use client';

import {
  PIN_SOURCE_LABEL,
  PinNumberBadge,
  type PinPosition,
  type PinSource,
  toPageLabel,
} from '@/entities/pin';
import type { ProjectMember } from '@/entities/project';
import {
  CHANGE_REQUEST_STATUS_LABEL,
  CHANGE_REQUEST_STATUSES,
  type ChangeRequestHistory,
  isMyTurn,
  useGetChangeRequest,
  useGetChangeRequestHistory,
} from '@/entities/request';
import type { ProjectRole, User } from '@/entities/user';
import { getPinCommentErrorMessage, ReplyBox, usePostPinComment } from '@/features/reply-pin';
import { SharePinIconButton } from '@/features/share-pin';
import { isApiError } from '@/shared/api';
import { formatRelativeTime } from '@/shared/lib';
import { AiBadge, Icon, toast } from '@/shared/ui';

import { parseAiSummary } from '../model/ai-summary';
import { buildTimeline, type ThreadEvent } from '../model/timeline';
import type { PinThread } from '../model/types';
import DetailConversation from './DetailConversation';
import DetailDecision from './DetailDecision';
import ReviewNoteSection from './ReviewNoteSection';

export interface RequestDetailProps {
  projectId: number;
  thread: PinThread;
  role: ProjectRole | undefined;
  me: User | undefined;
  /** 작성자 이메일과 역할을 찾습니다. */
  members: ProjectMember[];
  /** 지금 보는 사이트와 페이지("반영 위치 보기"를 숨길지, 확인 안내를 붙일지) */
  site: PinSource;
  currentPath: string | null;
  hasDeployment: boolean;
  onBack: () => void;
  /** 채팅에 공유한 뒤(채팅 서랍 열기) */
  onShared?: () => void;
  /** 위치를 다시 지정하는 중인 핀 */
  relocatingPinId: number | null;
  onRelocate?: (pinId: number) => void;
  onCancelRelocate?: () => void;
  /** "배포본에서 반영 위치 보기": 배포본으로 바꿔 그 위치로 이동합니다. */
  onShowReviewLocation?: (thread: PinThread, location: PinPosition) => void;
  onAddToReview: (requestId: number) => void;
  /** 답글을 보낸 뒤 패널을 맨 아래로 내립니다. */
  onReplied?: () => void;
}

/** 상세 섹션(흰 카드). 사이 회색 띠는 감싸는 쪽 `gap`으로 둡니다. */
const sectionClassName = 'bg-white px-9 py-8';
const headingClassName = 'text-ink mb-3.5 text-base font-extrabold';

/**
 * 오른쪽 패널의 요청 상세 (demo-design `renderDetail`).
 * 머리글(고정) → 요청 → (검수 요청을 받았으면) 반영 내용 → 대화 → 결정과 답글(아래 고정)
 */
const RequestDetail = ({
  projectId,
  thread,
  role,
  me,
  members,
  site,
  currentPath,
  hasDeployment,
  onBack,
  onShared,
  relocatingPinId,
  onRelocate,
  onCancelRelocate,
  onShowReviewLocation,
  onAddToReview,
  onReplied,
}: RequestDetailProps) => {
  const { pinId, pinNumber, status, changeRequestId } = thread;
  const { data: request } = useGetChangeRequest(projectId, changeRequestId);
  const { data: history = [] } = useGetChangeRequestHistory(projectId, changeRequestId);
  const postComment = usePostPinComment(projectId, pinId ?? 0);

  const member = new Map(members.map((item) => [item.id, item]));
  const toEvent = (entry: ChangeRequestHistory): ThreadEvent => ({
    fromStatus: entry.from_status,
    toStatus: entry.to_status,
    authorName: member.get(entry.changed_by)?.email ?? '참여자',
    authorRole: member.get(entry.changed_by)?.role ?? 'client',
    isMine: entry.changed_by === me?.id,
    reason: entry.reason,
    createdAt: entry.created_at,
    timeLabel: formatRelativeTime(entry.created_at),
  });
  const timeline = buildTimeline(thread.comments, history.map(toEvent));

  const step = CHANGE_REQUEST_STATUSES.indexOf(status);
  const isLocked = status === 'resolved';
  const isLost = thread.locationStatus === 'needs_check' && pinId !== null && !isLocked;
  const isRelocating = pinId !== null && relocatingPinId === pinId;
  const summary = thread.aiSummary?.trim() ? parseAiSummary(thread.aiSummary) : null;

  const reviewItem = request?.latest_review_item ?? null;
  const reviewLocation = reviewItem?.location ?? null;
  // 반영 내용을 쓴 사람과 시간은 검수 요청으로 바뀐 마지막 이력에서 찾습니다.
  const reviewEntry = history.findLast((entry) => entry.to_status === 'pending_review');
  const isViewingReviewLocation =
    site === 'deployment' && !!reviewLocation && reviewLocation.page_path === currentPath;

  const requestMeta = [
    thread.requestAuthorName,
    thread.requestTimeLabel,
    thread.source && thread.pagePath
      ? `${PIN_SOURCE_LABEL[thread.source]} ${toPageLabel(thread.pagePath)}`
      : '채팅에서 등록 · 위치 없음',
  ]
    .filter(Boolean)
    .join(' · ');

  const reply = async (content: string) => {
    try {
      await postComment.mutateAsync({ content });
      requestAnimationFrame(() => onReplied?.());
    } catch (error) {
      toast(
        isApiError(error) ? getPinCommentErrorMessage(error, 'create') : '답글을 남기지 못했어요.',
      );
      throw error;
    }
  };

  return (
    <div className="bg-stage flex min-h-full animate-[slide-in_0.3s_var(--ease-out-soft)] flex-col">
      <header className="border-divider sticky top-0 z-[2] flex h-[76px] shrink-0 items-center gap-2.5 border-b bg-white pr-9 pl-6">
        <button
          type="button"
          onClick={onBack}
          aria-label="목록으로"
          className="text-muted hover:bg-hover hover:text-ink grid size-[34px] place-items-center rounded-[10px] transition-colors"
        >
          <Icon name="left" size={18} />
        </button>
        <PinNumberBadge number={pinNumber} filled />
        <h2 className="text-lg font-extrabold">
          {pinNumber === null ? '채팅 요청' : `핀 ${pinNumber}`}
        </h2>
        <span className="bg-hover text-text rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap">
          {CHANGE_REQUEST_STATUS_LABEL[status]} · {step + 1}/{CHANGE_REQUEST_STATUSES.length}
        </span>
        {isMyTurn(status, role) && (
          <span className="text-ink before:bg-alert inline-flex items-center gap-[5px] text-xs font-bold whitespace-nowrap before:size-1.5 before:rounded-full before:content-['']">
            내 차례
          </span>
        )}
        <span className="flex-1" />
        {pinId !== null && pinNumber !== null && (
          <SharePinIconButton
            projectId={projectId}
            pinId={pinId}
            pinNumber={pinNumber}
            onShared={onShared}
          />
        )}
      </header>

      <div className="flex flex-col gap-2">
        <section className={sectionClassName}>
          <h3 className={headingClassName}>요청</h3>
          <p className="text-ink text-[17px] leading-[1.65] wrap-anywhere whitespace-pre-wrap">
            {thread.title}
          </p>
          <p className="text-muted mt-2 text-[13px]">{requestMeta}</p>

          {isLost && (
            <div className="bg-warn-soft text-warn-strong mt-3 flex items-center gap-2 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold">
              <Icon name="alert" size={16} />
              <span>
                {isRelocating
                  ? '사이트에서 새 위치를 눌러 주세요'
                  : '이 화면에서 핀 자리를 찾지 못했어요'}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (isRelocating) onCancelRelocate?.();
                  else if (pinId !== null) onRelocate?.(pinId);
                }}
                className="ml-auto shrink-0 text-[13px] font-extrabold underline underline-offset-[3px]"
              >
                {isRelocating ? '취소' : '위치 다시 지정'}
              </button>
            </div>
          )}

          {summary && (
            <div className="bg-ai mt-[18px] rounded-xl p-4">
              <div className="text-text mb-2.5 flex items-center gap-1.5 text-[13px] font-bold">
                <AiBadge />
                개발 요청으로 정리
              </div>
              {summary.title && (
                <b className="mb-2 block text-[15px] font-bold wrap-anywhere">{summary.title}</b>
              )}
              {summary.items.length > 0 && (
                <ul className="grid gap-1">
                  {summary.items.map((item, index) => (
                    <li
                      key={index}
                      className="text-text before:bg-muted relative pl-3.5 text-sm leading-[1.6] wrap-anywhere before:absolute before:top-[9px] before:left-px before:size-1 before:rounded-full before:content-['']"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        {reviewItem && (
          <ReviewNoteSection
            item={reviewItem}
            authorName={reviewEntry ? (member.get(reviewEntry.changed_by)?.email ?? null) : null}
            timeLabel={formatRelativeTime(reviewEntry?.created_at)}
            hasDeployment={hasDeployment}
            isViewingLocation={isViewingReviewLocation}
            onShowLocation={(location) => onShowReviewLocation?.(thread, location)}
          />
        )}

        <DetailConversation
          projectId={projectId}
          pinId={pinId}
          items={timeline}
          isLocked={isLocked}
        />
      </div>

      <footer className="border-divider sticky bottom-0 z-[2] mt-auto grid gap-3 border-t bg-white px-9 pt-5 pb-8">
        <DetailDecision
          projectId={projectId}
          requestId={changeRequestId}
          pinNumber={pinNumber}
          status={status}
          role={role}
          showLocationHint={site !== 'deployment' && !!reviewLocation}
          onAddToReview={onAddToReview}
        />
        {isLocked ? (
          <p className="text-muted flex items-center gap-1.5 text-[13px]">
            <Icon name="lock" size={14} />
            해결된 요청은 읽기 전용이에요. 추가 수정은 새 핀으로 남겨 주세요.
          </p>
        ) : (
          pinId !== null && (
            <ReplyBox
              placeholder={`${me?.email ?? '나'}(으)로 답글 남기기 · Enter로 보내기`}
              isPending={postComment.isPending}
              onSubmit={reply}
            />
          )
        )}
      </footer>
    </div>
  );
};

export default RequestDetail;
