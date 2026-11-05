'use client';

import { useEffect, useState } from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useGetMessages } from '@/entities/message';
import {
  type PinPosition as PinLocation,
  type PinSource,
  useGetPinCommentsByPin,
  useGetPins,
} from '@/entities/pin';
import {
  useGetDraftPreviewHtml,
  useGetProject,
  useGetProjectDraft,
  useGetProjectMembers,
} from '@/entities/project';
import { isHiddenByDefault, useGetChangeRequests } from '@/entities/request';
import { can, useGetMe } from '@/entities/user';
import { useRelocatePin, useReportPinLocation } from '@/features/check-pin-location';
import {
  ConnectDeploymentDialog,
  DeploymentEmptyState,
  PIN_SCRIPT_MISSING_TOAST,
  PinScriptMissingNotice,
  toDeploymentHost,
} from '@/features/connect-deployment';
import { usePostPin } from '@/features/create-pin';
import { useViewerSite, VIEWER_SITE_PIN_SOURCE } from '@/features/switch-site';
import { formatRelativeTime, useSearchFlag } from '@/shared/lib';
import { toast } from '@/shared/ui';
import { ChatDrawer } from '@/widgets/chat-drawer';
import {
  getPanelView,
  isWidePanelView,
  type ReviewSession,
  type SelectedPin,
  SideChatPanel,
  toThreadId,
  useGetLatestReviewItems,
} from '@/widgets/side-chat';
import {
  DeployedSiteFrame,
  DraftPreviewFrame,
  type PinPosition,
  type PinScriptStatus,
  type SiteAddress,
  type SiteHistoryControls,
  SiteViewer,
  toSitePages,
  type ViewerMode,
} from '@/widgets/site-viewer';
import { CHAT_SEARCH_FLAG } from '@/widgets/top-bar';
import { WorkspaceLayout } from '@/widgets/workspace-layout';

import { canMoveHistory, EMPTY_SITE_HISTORY, moveHistory, visitPath } from '../model/history';
import {
  getPagePath,
  getReviewItemRequestIds,
  getThreadPins,
  toMessages,
  toPinThreads,
  toSiteViewerPins,
} from '../model/mappers';

const NEED_DEPLOYMENT_FOR_REVIEW = '검수 요청을 보내려면 먼저 배포 주소를 연결해 주세요.';

/** 요청 관리의 "검수 요청 만들기"(`?review=1`)와 "검수 요청에 담기"(`&pick=요청 id`)로 들어온 경우 */
const readReviewQuery = (params: URLSearchParams) => {
  if (params.get('review') !== '1') return null;
  const pick = Number(params.get('pick'));
  return Number.isInteger(pick) && pick > 0 ? [pick] : [];
};

interface SiteViewerViewProps {
  projectId: number;
}

/**
 * 작업 화면(demo-design `workspace.html`). 왼쪽은 초안 A·배포본 B 미리보기, 오른쪽은 요청 패널,
 * 채팅은 상단 바의 "채팅 N"으로 여는 서랍입니다.
 */
const SiteViewerView = ({ projectId }: SiteViewerViewProps) => {
  const [mode, setMode] = useState<ViewerMode>('browse');
  const [draftPin, setDraftPin] = useState<PinPosition | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedPin, setSelectedPin] = useState<SelectedPin | null>(null);
  // 채팅 서랍은 상단 바 버튼과 같은 주소 쿼리(`?chat=1`)로 열고 닫습니다.
  const [isChatOpen, setIsChatOpen] = useSearchFlag(CHAT_SEARCH_FLAG);
  // 검수 요청 만들기(개발자): 고른 요청마다 배포본에 찍은 반영 위치와, 지금 찍는 중인 요청
  const [review, setReview] = useState<ReviewSession | null>(null);
  const [reviewLocations, setReviewLocations] = useState<Partial<Record<number, PinLocation>>>({});
  const [placingRequestId, setPlacingRequestId] = useState<number | null>(null);
  // 배포 연결 대화상자. 검수 요청 중 "변경"이나 배포 전 검수 요청에서 엽니다.
  const [deployDialog, setDeployDialog] = useState<{ banner?: string } | null>(null);
  // "완료 보기": 해결된 핀 마커와 스레드를 함께 보이고 숨깁니다.
  const [showResolved, setShowResolved] = useState(false);
  // 핀 스크립트가 알려 준 배포 사이트의 지금 경로와 연결 상태
  const [deployedPath, setDeployedPath] = useState<string | null>(null);
  const [scriptStatus, setScriptStatus] = useState<PinScriptStatus>('connecting');
  // 배포 사이트 안 이동 기록(뒤로/앞으로)과, 주소창·뒤로/앞으로로 옮겨 갈 경로
  const [siteHistory, setSiteHistory] = useState(EMPTY_SITE_HISTORY);
  const [navigation, setNavigation] = useState<{ path: string; seq: number } | null>(null);
  // 새로고침: 미리보기를 다시 마운트합니다. 배포 사이트는 보고 있던 경로(또는 이동할 경로)를 다시 엽니다.
  const [reload, setReload] = useState<{ key: number; path: string | null }>({
    key: 0,
    path: null,
  });
  // 초안에서 "배포본에서 반영 위치 보기"를 누르면 배포본으로 바꾼 뒤 이 경로를 엽니다.
  const [pathAfterSwitch, setPathAfterSwitch] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // 요청 관리에서 넘어온 검수 요청 열기. 프로젝트를 받은 뒤 한 번만 엽니다.
  const [reviewQuery, setReviewQuery] = useState(() => readReviewQuery(searchParams));

  const { data: me } = useGetMe();
  const { data: project } = useGetProject(projectId);
  const { data: members = [] } = useGetProjectMembers(projectId);
  const { data: pins = [] } = useGetPins(projectId);
  const { data: messages = [] } = useGetMessages(projectId);
  const { data: draft } = useGetProjectDraft(projectId);
  const role = project?.my_role;
  const deploymentUrl = project?.deployment_url ?? null;
  // 상단바에서 고른 사이트. 배포 주소가 생겨도 초안을 다시 볼 수 있습니다.
  const { site, setSite } = useViewerSite({ hasDraft: !!draft, hasDeployment: !!deploymentUrl });
  const showDraft = !!project && site === 'draft' && !!draft;
  const showDeployed = !!project && site === 'deployed' && !!deploymentUrl;
  const pinSource: PinSource = site ? VIEWER_SITE_PIN_SOURCE[site] : 'draft';
  // 사이트를 바꾸면 저장 전인 새 핀은 다른 사이트 위치라서 닫습니다.
  const [prevSite, setPrevSite] = useState(site);
  if (site !== prevSite) {
    setPrevSite(site);
    setDraftPin(null);
    setDeployedPath(null);
    setSiteHistory(EMPTY_SITE_HISTORY);
    setReload({ key: 0, path: pathAfterSwitch });
    setPathAfterSwitch(null);
  }
  const draftPreview = useGetDraftPreviewHtml(projectId, showDraft ? draft : null);
  // 고른 요청은 해결됐어도(승인 직후 등) 대화가 보이도록 댓글을 계속 받습니다.
  const commentPinIds = getThreadPins(pins, showResolved).map((pin) => pin.id);
  const selectedPinId = selectedPin ? Number(selectedPin.id) : NaN;
  if (Number.isInteger(selectedPinId) && !commentPinIds.includes(selectedPinId)) {
    commentPinIds.push(selectedPinId);
  }
  const commentsByPin = useGetPinCommentsByPin(projectId, commentPinIds);
  const canCreateRequest = can(role, 'create-request-from-message');
  const { data: requests = [] } = useGetChangeRequests(projectId, 'all');
  const reviewItems = useGetLatestReviewItems(
    projectId,
    getReviewItemRequestIds(requests, showResolved),
  );
  const postPin = usePostPin(projectId);
  const threads = toPinThreads({
    pins,
    commentsByPin,
    members,
    me,
    requests,
    reviewItems,
    messages,
  });
  const placingNumber =
    threads.find((thread) => thread.changeRequestId === placingRequestId)?.pinNumber ?? null;
  const relocatePin = useRelocatePin(projectId);
  const { reportMissing, reportFound } = useReportPinLocation(projectId);

  const selectThread = (id: string) =>
    setSelectedPin((prev) => ({ id, seq: (prev?.seq ?? 0) + 1 }));

  const handleSubmitPin = (content: string) => {
    if (!draftPin?.anchor || !project) return;
    postPin.mutate(
      {
        role: project.my_role,
        ...draftPin.anchor,
        source: pinSource,
        request_content: content,
      },
      {
        onSuccess: ({ pin, requestFailed }) => {
          setDraftPin(null);
          setMode('browse');
          setNotice(
            requestFailed
              ? '핀은 저장했지만 수정 요청으로 등록하지 못했어요. 새로고침 후 확인해 주세요.'
              : null,
          );
          toast(`핀 ${pins.length + 1}을 남겼어요 · AI가 개발 요청으로 정리하고 있어요`);
          selectThread(String(pin.id));
        },
      },
    );
  };

  // 초안 미리보기와 핀 스크립트가 연결된 배포 사이트만 핀을 만들므로 요소 기준 앵커가 항상 있습니다.
  // 화면 좌표만으로는 스크롤하면 위치가 어긋나서 앵커 없는 위치는 받지 않습니다(FE#80).
  const handlePlacePin = (position: PinPosition) => {
    if (!position.anchor) return;
    // 검수 요청의 반영 위치를 찍는 중이면 그 요청의 위치로 두고 체험 모드로 돌아갑니다.
    if (placingRequestId !== null) {
      const anchor = position.anchor;
      setReviewLocations((prev) => ({ ...prev, [placingRequestId]: anchor }));
      setPlacingRequestId(null);
      setMode('browse');
      toast(`${placingNumber ? `핀 ${placingNumber}` : '요청'} 반영 위치를 찍었어요`);
      return;
    }
    // 위치 다시 지정 중이면 새 핀 대신 그 핀을 옮깁니다.
    if (relocatePin.pinId !== null) {
      relocatePin.place(position.anchor);
      return;
    }
    postPin.reset();
    setNotice(null);
    setDraftPin(position);
  };

  // 배포 사이트는 고른 핀의 `pagePath`로 옮겨 핀으로 스크롤합니다(`DeployedSiteFrame`).
  // 같은 핀을 다시 눌러도 이동하도록 `seq`를 올립니다.
  // 숨겨 둔 해결된 핀을 고르면(채팅의 핀 카드 등) "완료 보기"를 켭니다.
  const handleSelectPin = (pinId: string) => {
    const status = pins.find((pin) => String(pin.id) === pinId)?.request_status;
    if (status && isHiddenByDefault(status)) setShowResolved(true);
    selectThread(pinId);
  };

  // 배포 URL과 초안이 모두 없으면 백엔드가 409를 돌려줍니다.
  const pinErrorMessage = postPin.error
    ? postPin.error.code === 'CONFLICT'
      ? '배포 사이트나 초안이 있어야 핀을 남길 수 있어요.'
      : postPin.error.message
    : null;

  // 핀 모드를 막는 이유. 막혀 있으면 핀 버튼을 눌러도 체험 모드에 머물고 이 안내를 띄웁니다.
  // 개발자는 새 핀을 만들지 않고, 검수 요청 때 반영 위치를 찍거나 위치를 다시 지정할 때만 핀 모드를 씁니다.
  const isPlacing = placingRequestId !== null || relocatePin.pinId !== null;
  const pinBlockedMessage =
    project && !project.deployment_url && draft === null
      ? '초안을 만들거나 배포 사이트를 연결하면 핀을 남길 수 있어요'
      : showDeployed && scriptStatus === 'disconnected'
        ? PIN_SCRIPT_MISSING_TOAST
        : project && !can(project.my_role, 'create-pin') && !isPlacing
          ? '개발자는 검수 요청을 만들 때 반영 위치를 찍어요'
          : null;
  const scriptNotice =
    showDeployed && scriptStatus === 'disconnected' ? (
      <PinScriptMissingNotice projectId={projectId} />
    ) : undefined;
  // 초안 핀은 초안에서, 배포본 핀은 배포본에서만 위치를 확인합니다(반영 위치 표시는 보고하지 않음).
  const handlePinMissing = (id: string) => reportMissing(Number(id));
  const handlePinFound = (id: string) => reportFound(Number(id));

  const viewerPins = toSiteViewerPins({
    pins,
    role,
    showResolved,
    site: pinSource,
    reviewItems,
    placedLocations: review ? reviewLocations : {},
  });
  const isScriptConnected = showDeployed && scriptStatus === 'connected';

  const handlePathChange = (path: string) => {
    setDeployedPath(path);
    setSiteHistory((history) => visitPath(history, path));
  };
  const goToPath = (path: string) => setNavigation((prev) => ({ path, seq: (prev?.seq ?? 0) + 1 }));
  const moveSiteHistory = (step: number) => {
    const next = moveHistory(siteHistory, step);
    if (!next) return;
    setSiteHistory(next);
    goToPath(next.entries[next.index]);
  };
  // 핀 스크립트가 있어야 사이트 안 경로를 알고 옮길 수 있습니다.
  const history: SiteHistoryControls | undefined = showDeployed
    ? {
        canGoBack: isScriptConnected && canMoveHistory(siteHistory, -1),
        canGoForward: isScriptConnected && canMoveHistory(siteHistory, 1),
        onBack: () => moveSiteHistory(-1),
        onForward: () => moveSiteHistory(1),
      }
    : undefined;

  const frameUrl =
    deploymentUrl && reload.path ? new URL(reload.path, deploymentUrl).href : deploymentUrl;
  const currentPath = deployedPath ?? getPagePath(frameUrl);
  // 초안은 한 페이지(`/`)만 있지만 시안처럼 페이지 목록과 핀 수를 보여 줍니다.
  const address: SiteAddress | undefined =
    showDeployed && deploymentUrl
      ? {
          host: toDeploymentHost(deploymentUrl),
          path: currentPath,
          ...(isScriptConnected && {
            pages: toSitePages(viewerPins, currentPath),
            onSelectPage: goToPath,
          }),
        }
      : showDraft
        ? {
            host: `draft.respec.app/${projectId}`,
            path: '/',
            pages: toSitePages(viewerPins, '/'),
            onSelectPage: () => {},
          }
        : undefined;
  const handleReload =
    showDeployed || showDraft
      ? () => setReload((prev) => ({ key: prev.key + 1, path: showDeployed ? currentPath : null }))
      : undefined;
  // 미리보기 아래 시각. 배포본은 RE:SPEC에 주소를 연결한 시각이라 이전 프로젝트는 없을 수 있습니다.
  const footnote =
    showDraft && draft
      ? `초안 생성 · ${formatRelativeTime(draft.updated_at)}`
      : showDeployed && project?.deployment_updated_at
        ? `마지막 배포 · ${formatRelativeTime(project.deployment_updated_at)}`
        : undefined;

  const startRelocate = (pinId: number) => {
    setDraftPin(null);
    relocatePin.start(pinId, threads.find((thread) => thread.id === String(pinId))?.pinNumber ?? 0);
  };

  // 검수 요청은 배포본에 반영 위치를 찍어야 해서 배포본으로 옮겨 엽니다. 배포 전이면 먼저 연결합니다.
  const openReview = (preselectedIds: number[]) => {
    if (!deploymentUrl) {
      setDeployDialog({ banner: NEED_DEPLOYMENT_FOR_REVIEW });
      return;
    }
    setSelectedPin(null);
    setDraftPin(null);
    setReviewLocations({});
    setReview((prev) => ({ seq: (prev?.seq ?? 0) + 1, preselectedIds }));
    if (site !== 'deployed') setSite('deployed');
  };

  const closeReview = () => {
    setReview(null);
    setPlacingRequestId(null);
    setMode('browse');
  };

  // 반영 위치 찍기를 누르면 핀 모드로 들어가고, 같은 요청을 다시 누르면 취소합니다.
  const startPlacing = (requestId: number | null) => {
    setPlacingRequestId(requestId);
    setMode(requestId === null ? 'browse' : 'pin');
  };

  // 반영 위치는 배포본에 찍은 것이라 배포본의 그 페이지로 옮기고 그 핀을 보여 줍니다.
  const showReviewLocation = (threadId: string, location: PinLocation) => {
    if (site === 'deployed') goToPath(location.page_path);
    else {
      setPathAfterSwitch(location.page_path);
      setSite('deployed');
    }
    selectThread(threadId);
  };

  // 요청 관리에서 넘어오면 프로젝트를 받은 뒤 검수 요청 화면을 엽니다. 배포 전이면 먼저 연결합니다.
  if (reviewQuery && project) {
    setReviewQuery(null);
    if (project.deployment_url) {
      setReview({ seq: 1, preselectedIds: reviewQuery });
    } else {
      setDeployDialog({ banner: NEED_DEPLOYMENT_FOR_REVIEW });
    }
  }
  // 새로고침하면 다시 열리지 않도록 쿼리를 지우고, 반영 위치를 찍을 배포본으로 옮깁니다.
  const hasReviewQuery = searchParams.get('review') === '1';
  useEffect(() => {
    if (!hasReviewQuery || !project) return;
    const params = new URLSearchParams(searchParams);
    params.delete('review');
    params.delete('pick');
    if (project.deployment_url) params.set('site', 'deployed');
    router.replace(`${pathname}?${params}`, { scroll: false });
  }, [hasReviewQuery, project, searchParams, router, pathname]);

  const newRequest =
    draftPin?.anchor && project
      ? {
          pinNumber: pins.length + 1,
          source: pinSource,
          pagePath: draftPin.anchor.page_path,
          elementLabel: draftPin.anchor.location_context?.section_name ?? null,
        }
      : null;
  const panelView = getPanelView({
    isReviewOpen: !!review,
    hasNewRequest: !!newRequest,
    hasSelection: !!selectedPin && threads.some((thread) => thread.id === selectedPin.id),
  });

  // 모드를 바꾸면(V, Esc, 체험 버튼) 저장 전인 새 핀은 버립니다.
  const handleModeChange = (next: ViewerMode) => {
    setMode(next);
    if (next === 'browse') setDraftPin(null);
  };

  const placingHint =
    placingRequestId !== null
      ? `${placingNumber ? `핀 ${placingNumber}의 ` : ''}반영 위치를 눌러 주세요 · Esc로 취소`
      : relocatePin.hint;

  return (
    <WorkspaceLayout
      openKey={selectedPin}
      requestCount={getThreadPins(pins).length}
      isPanelWide={isWidePanelView(panelView)}
      panel={
        <SideChatPanel
          projectId={projectId}
          role={role}
          me={me}
          members={members}
          threads={threads}
          site={pinSource}
          currentPath={showDeployed ? currentPath : showDraft ? '/' : null}
          showResolved={showResolved}
          deploymentHost={deploymentUrl ? toDeploymentHost(deploymentUrl) : null}
          otherPagesHref={`/projects/${projectId}/requests`}
          selectedPin={selectedPin}
          onSelectPin={handleSelectPin}
          onClosePin={() => setSelectedPin(null)}
          onStartNewRequest={() => {
            if (pinBlockedMessage) {
              toast(pinBlockedMessage);
              return;
            }
            setMode('pin');
            toast('사이트에서 바꾸고 싶은 곳을 눌러 주세요');
          }}
          newRequest={newRequest}
          onSubmitNewRequest={handleSubmitPin}
          onCancelNewRequest={() => setDraftPin(null)}
          isSubmittingNewRequest={postPin.isPending}
          newRequestError={pinErrorMessage}
          relocatingPinId={relocatePin.pinId}
          onRelocate={startRelocate}
          onCancelRelocate={relocatePin.cancel}
          onShowReviewLocation={(thread, location) => showReviewLocation(thread.id, location)}
          onSharedPin={() => setIsChatOpen(true)}
          review={review}
          onOpenReview={openReview}
          onCloseReview={closeReview}
          reviewLocations={reviewLocations}
          placingRequestId={placingRequestId}
          onStartPlacing={startPlacing}
          onChangeDeployment={() => setDeployDialog({})}
        />
      }
    >
      <main className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col">
        <SiteViewer
          url={deploymentUrl ?? '배포 사이트가 아직 연결되지 않았어요'}
          pins={viewerPins}
          selectedPinId={selectedPin?.id ?? null}
          onPlacePin={handlePlacePin}
          onSelectPin={handleSelectPin}
          draftPin={draftPin}
          draftPinNumber={pins.length + 1}
          mode={mode}
          onModeChange={handleModeChange}
          pinBlockedMessage={pinBlockedMessage}
          notice={scriptNotice}
          address={address}
          scriptStatus={showDeployed ? scriptStatus : showDraft ? 'connected' : undefined}
          history={history}
          onReload={handleReload}
          footnote={footnote}
          placingHint={placingHint}
          onCancelPlacing={() => {
            if (placingRequestId !== null) startPlacing(null);
            else relocatePin.cancel();
          }}
          // Esc는 대화상자 → 입력칸 → 전체 화면 다음에 채팅 서랍을 닫습니다.
          onEscape={() => {
            if (!isChatOpen) return false;
            setIsChatOpen(false);
            return true;
          }}
          onFullscreenChange={(isFull) => {
            if (isFull && isChatOpen) setIsChatOpen(false);
          }}
          showResolved={showResolved}
          onShowResolvedChange={setShowResolved}
          renderSite={
            showDeployed && frameUrl
              ? (viewerMode, placePin) => (
                  <DeployedSiteFrame
                    key={`${deploymentUrl}#${reload.key}`}
                    url={frameUrl}
                    mode={viewerMode}
                    pins={viewerPins}
                    focusPin={selectedPin}
                    navigateTo={navigation}
                    onPlacePin={placePin}
                    onSelectPin={handleSelectPin}
                    onPinMissing={handlePinMissing}
                    onPinFound={handlePinFound}
                    onPathChange={handlePathChange}
                    onStatusChange={setScriptStatus}
                    draftPin={draftPin}
                    draftPinNumber={pins.length + 1}
                  />
                )
              : showDraft
                ? (viewerMode, placePin) => (
                    <DraftPreviewFrame
                      key={reload.key}
                      html={draftPreview.data}
                      error={draftPreview.error}
                      mode={viewerMode}
                      pins={viewerPins}
                      onPlacePin={placePin}
                      onSelectPin={handleSelectPin}
                      selectedPinId={selectedPin?.id ?? null}
                      focusPin={selectedPin}
                      draftPin={draftPin}
                      draftPinNumber={pins.length + 1}
                      onPinMissing={handlePinMissing}
                      onPinFound={handlePinFound}
                    />
                  )
                : undefined
          }
        >
          {/* `false`를 넘기면 URL 문구 대신 빈칸이 되므로 undefined로 둡니다. */}
          {project && !project.deployment_url && !draft ? (
            <DeploymentEmptyState projectId={projectId} />
          ) : undefined}
        </SiteViewer>
        {notice && (
          <p
            role="alert"
            className="text-warn bg-warn-soft absolute top-4 left-1/2 z-30 -translate-x-1/2 rounded-[10px] px-3.5 py-2 text-[13px] font-semibold"
          >
            {notice}
          </p>
        )}
      </main>
      <ChatDrawer
        projectId={projectId}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        projectName={project?.name ?? ''}
        memberEmails={members.map((member) => member.email)}
        messages={toMessages(messages, pins, members, me, requests)}
        canCreateRequest={canCreateRequest}
        onOpenSharedPin={handleSelectPin}
        onRequestCreated={(request) => selectThread(toThreadId(request.pin_id, request.id))}
      />
      {deployDialog && (
        <ConnectDeploymentDialog
          projectId={projectId}
          currentUrl={deploymentUrl}
          banner={deployDialog.banner}
          onClose={() => setDeployDialog(null)}
          onConnected={() => setSite('deployed')}
        />
      )}
    </WorkspaceLayout>
  );
};

export default SiteViewerView;
