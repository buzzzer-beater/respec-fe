'use client';

import { useEffect, useEffectEvent, useLayoutEffect, useRef } from 'react';

import type { PinPosition, PinSource } from '@/entities/pin';
import type { ProjectMember } from '@/entities/project';
import type { ProjectRole, User } from '@/entities/user';
import { NewRequestForm } from '@/features/create-pin';
import { ReviewRequestPanel } from '@/features/request-review';
import { cn } from '@/shared/lib';
import { Button } from '@/shared/ui';

import { getPanelView } from '../model/panel-view';
import type { NewRequestDraft, PinThread, ReviewSession, SelectedPin } from '../model/types';
import RequestDetail from './RequestDetail';
import RequestList from './RequestList';

export interface SideChatPanelProps {
  projectId: number;
  role: ProjectRole | undefined;
  me: User | undefined;
  members: ProjectMember[];
  /** 모든 요청(해결됨 포함, 핀 없는 채팅 요청 포함). `toPinThreads`로 만듭니다. */
  threads: PinThread[];
  /** 지금 보는 사이트와 페이지. 목록을 이 페이지 기준으로 나눕니다. */
  site: PinSource;
  currentPath: string | null;
  /** "완료 보기": 목록에 해결된 요청도 넣습니다. */
  showResolved?: boolean;
  /** 프로젝트에 연결한 배포 주소의 호스트. 연결 전이면 `null` */
  deploymentHost: string | null;
  /** "다른 페이지 요청 N개 보기"로 갈 주소 */
  otherPagesHref?: string;

  // ── 목록 ──
  selectedPin?: SelectedPin | null;
  /** 목록, 지금 할 일 카드, 주소의 `#pin-{id}`에서 요청을 골랐을 때 */
  onSelectPin?: (threadId: string, thread: PinThread) => void;
  /** 상세에서 목록으로 돌아갈 때(고른 요청 해제) */
  onClosePin?: () => void;
  /** 고객 "새 요청 남기기": 부모가 뷰어를 핀 모드로 바꾸고 안내합니다. */
  onStartNewRequest?: () => void;

  // ── 새 요청 ──
  /** 사이트에서 핀 자리를 눌렀으면 새 요청 입력을 보여 줍니다. */
  newRequest?: NewRequestDraft | null;
  onSubmitNewRequest?: (content: string) => void;
  onCancelNewRequest?: () => void;
  isSubmittingNewRequest?: boolean;
  newRequestError?: string | null;

  // ── 상세 ──
  /** 위치 다시 지정 중인 핀. 상세의 안내 상자가 "취소"로 바뀝니다. */
  relocatingPinId?: number | null;
  onRelocate?: (pinId: number) => void;
  onCancelRelocate?: () => void;
  /** "배포본에서 반영 위치 보기" */
  onShowReviewLocation?: (thread: PinThread, location: PinPosition) => void;
  /** 핀을 채팅에 공유한 뒤(채팅 서랍 열기) */
  onSharedPin?: () => void;

  // ── 검수 요청 (개발자) ──
  /** 열려 있으면 검수 요청 화면을 보여 줍니다. */
  review?: ReviewSession | null;
  /** "검수 요청 만들기"(목록 아래) 또는 "검수 요청에 담기"(상세)로 열 때 */
  onOpenReview?: (preselectedIds: number[]) => void;
  onCloseReview?: () => void;
  /** 요청 id → 배포본에 찍은 반영 위치. 뷰어에서 고른 위치를 부모가 넣어 줍니다. */
  reviewLocations?: Partial<Record<number, PinPosition>>;
  placingRequestId?: number | null;
  /** 반영 위치 누르기 시작(요청 id) 또는 취소(`null`) */
  onStartPlacing?: (requestId: number | null) => void;
  /** 검수할 사이트 "변경"/"연결" */
  onChangeDeployment?: () => void;
}

/**
 * 작업 화면 오른쪽 패널 (demo-design `renderPanel`). 목록 / 요청 상세 / 새 요청 / 검수 요청 네 화면을 바꿔 보여 줍니다.
 * 채팅은 패널이 아니라 상단바에서 여는 서랍(`ChatDrawer`)입니다.
 * 폭은 화면마다 달라서(`isWidePanelView`) `WorkspaceLayout`에 같은 기준으로 넘겨 주세요.
 */
const SideChatPanel = ({
  projectId,
  role,
  me,
  members,
  threads,
  site,
  currentPath,
  showResolved = false,
  deploymentHost,
  otherPagesHref,
  selectedPin,
  onSelectPin,
  onClosePin,
  onStartNewRequest,
  newRequest,
  onSubmitNewRequest,
  onCancelNewRequest,
  isSubmittingNewRequest,
  newRequestError,
  relocatingPinId = null,
  onRelocate,
  onCancelRelocate,
  onShowReviewLocation,
  onSharedPin,
  review,
  onOpenReview,
  onCloseReview,
  reviewLocations = {},
  placingRequestId = null,
  onStartPlacing,
  onChangeDeployment,
}: SideChatPanelProps) => {
  const bodyRef = useRef<HTMLDivElement>(null);
  const selectedThread = selectedPin
    ? threads.find((thread) => thread.id === selectedPin.id)
    : undefined;
  const view = getPanelView({
    isReviewOpen: !!review,
    hasNewRequest: !!newRequest,
    hasSelection: !!selectedThread,
  });
  const working = threads.filter((thread) => thread.status === 'in_progress');

  // 화면이나 고른 요청이 바뀌면 맨 위부터 보여 줍니다.
  useLayoutEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [view, selectedThread?.id, review?.seq]);

  // 주소의 `#pin-{id}`(요청 관리의 "핀으로 이동")는 요청이 처음 보일 때 한 번만 엽니다.
  const openedHashRef = useRef<string | null>(null);
  const openHashPin = useEffectEvent(() => {
    const hash = window.location.hash.slice(1);
    if (!hash.startsWith('pin-') || openedHashRef.current === hash) return;
    const thread = threads.find((item) => `pin-${item.id}` === hash);
    if (!thread) return;
    openedHashRef.current = hash;
    onSelectPin?.(thread.id, thread);
  });
  useEffect(() => openHashPin(), [threads]);

  const scrollToBottom = () =>
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });

  return (
    <aside className="flex h-full w-full min-w-0 flex-col border-l border-[#e2e2e7] bg-white">
      <div
        ref={bodyRef}
        className={cn(
          'min-h-0 flex-1 overflow-y-auto',
          (view === 'list' || view === 'new') && 'px-9 pt-9 pb-7',
        )}
      >
        {view === 'review' && review ? (
          <ReviewRequestPanel
            key={review.seq}
            projectId={projectId}
            candidates={working.map((thread) => ({
              requestId: thread.changeRequestId,
              pinNumber: thread.pinNumber,
              text: thread.title,
              source: thread.source,
              pagePath: thread.pagePath,
            }))}
            initialSelectedIds={review.preselectedIds}
            deploymentHost={deploymentHost}
            onChangeDeployment={onChangeDeployment}
            locations={reviewLocations}
            placingRequestId={placingRequestId}
            onStartPlacing={(requestId) => onStartPlacing?.(requestId)}
            onClose={() => onCloseReview?.()}
          />
        ) : view === 'new' && newRequest ? (
          <NewRequestForm
            {...newRequest}
            onSubmit={(content) => onSubmitNewRequest?.(content)}
            onCancel={() => onCancelNewRequest?.()}
            isPending={isSubmittingNewRequest}
            errorMessage={newRequestError}
          />
        ) : view === 'detail' && selectedThread ? (
          <div id={`pin-${selectedThread.id}`} className="min-h-full">
            <RequestDetail
              key={selectedThread.id}
              projectId={projectId}
              thread={selectedThread}
              role={role}
              me={me}
              members={members}
              site={site}
              currentPath={currentPath}
              hasDeployment={deploymentHost !== null}
              onBack={() => onClosePin?.()}
              onShared={onSharedPin}
              relocatingPinId={relocatingPinId}
              onRelocate={onRelocate}
              onCancelRelocate={onCancelRelocate}
              onShowReviewLocation={onShowReviewLocation}
              onAddToReview={(requestId) => onOpenReview?.([requestId])}
              onReplied={scrollToBottom}
            />
          </div>
        ) : (
          <RequestList
            threads={threads}
            site={site}
            currentPath={currentPath}
            showResolved={showResolved}
            role={role}
            onSelect={(thread) => onSelectPin?.(thread.id, thread)}
            otherPagesHref={otherPagesHref}
          />
        )}
      </div>

      {view === 'list' && role && (
        <div className="border-divider shrink-0 border-t px-9 pt-5 pb-8">
          {role === 'client' ? (
            <Button size="lg" onClick={onStartNewRequest} className="w-full">
              새 요청 남기기
            </Button>
          ) : (
            <Button size="lg" onClick={() => onOpenReview?.([])} className="w-full">
              {working.length > 0
                ? `검수 요청 만들기 · 작업 중 ${working.length}`
                : '검수 요청 만들기'}
            </Button>
          )}
        </div>
      )}
    </aside>
  );
};

export default SideChatPanel;
