'use client';

import { useState } from 'react';

import { useGetMessages } from '@/entities/message';
import { PinLocationBadge, useGetPinCommentsByPin, useGetPins } from '@/entities/pin';
import {
  useGetDraftPreviewHtml,
  useGetProject,
  useGetProjectDraft,
  useGetProjectMembers,
} from '@/entities/project';
import { isHiddenByDefault, useGetChangeRequests } from '@/entities/request';
import { can, useGetMe } from '@/entities/user';
import {
  RelocatePinButton,
  RelocatePinPrompt,
  useRelocatePin,
  useReportPinLocation,
} from '@/features/check-pin-location';
import {
  DeploymentEmptyState,
  PIN_SCRIPT_MISSING_MESSAGE,
  PinScriptMissingNotice,
  toDeploymentHost,
} from '@/features/connect-deployment';
import { PinCommentPopover, usePostPin } from '@/features/create-pin';
import { MessageRequestMenu } from '@/features/create-request-from-message';
import { usePostMessage } from '@/features/send-message';
import { SharePinButton } from '@/features/share-pin';
import { useViewerSite } from '@/features/switch-site';
import { formatRelativeTime } from '@/shared/lib';
import { type SelectedPin, SideChatPanel } from '@/widgets/side-chat';
import {
  DeployedSiteFrame,
  DraftPreviewFrame,
  type PinPosition,
  type PinScriptStatus,
  type SiteAddress,
  type SiteHistoryControls,
  SiteViewer,
} from '@/widgets/site-viewer';
import { WorkspaceLayout } from '@/widgets/workspace-layout';

import { canMoveHistory, EMPTY_SITE_HISTORY, moveHistory, visitPath } from '../model/history';
import {
  getPagePath,
  getThreadPins,
  toMessages,
  toPinThreads,
  toRequestPinOptions,
  toSitePages,
  toViewerPins,
} from '../model/mappers';

interface SiteViewerViewProps {
  projectId: number;
}

const SiteViewerView = ({ projectId }: SiteViewerViewProps) => {
  const [draftPin, setDraftPin] = useState<PinPosition | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedPin, setSelectedPin] = useState<SelectedPin | null>(null);
  // "완료 보기": 해결된 핀 마커와 스레드를 함께 보이고 숨깁니다.
  const [showResolved, setShowResolved] = useState(false);
  // 핀 스크립트가 알려 준 배포 사이트의 지금 경로와 연결 상태
  const [deployedPath, setDeployedPath] = useState<string | null>(null);
  const [scriptStatus, setScriptStatus] = useState<PinScriptStatus>('connecting');
  // 배포 사이트 안 이동 기록(뒤로/앞으로)과, 주소창·뒤로/앞으로로 옮겨 갈 경로
  const [siteHistory, setSiteHistory] = useState(EMPTY_SITE_HISTORY);
  const [navigation, setNavigation] = useState<{ path: string; seq: number } | null>(null);
  // 새로고침: 미리보기를 다시 마운트합니다. 배포 사이트는 보고 있던 경로를 다시 엽니다.
  const [reload, setReload] = useState<{ key: number; path: string | null }>({
    key: 0,
    path: null,
  });

  const { data: me } = useGetMe();
  const { data: project } = useGetProject(projectId);
  const { data: members = [] } = useGetProjectMembers(projectId);
  const { data: pins = [] } = useGetPins(projectId);
  const { data: messages = [], isSuccess: messagesLoaded } = useGetMessages(projectId);
  const { data: draft } = useGetProjectDraft(projectId);
  const deploymentUrl = project?.deployment_url ?? null;
  // 상단바에서 고른 사이트. 배포 주소가 생겨도 초안을 다시 볼 수 있습니다.
  const { site } = useViewerSite({ hasDraft: !!draft, hasDeployment: !!deploymentUrl });
  const showDraft = !!project && site === 'draft' && !!draft;
  const showDeployed = !!project && site === 'deployed' && !!deploymentUrl;
  // 배포 후에 초안을 볼 때는 배포본 기준 핀의 위치 상태를 바꾸지 않도록 위치 보고를 하지 않습니다.
  // 초안 핀과 배포본 핀을 나누는 `pins.source`가 생기면 사이트별로 핀을 걸러 보고합니다.
  const reportsLocation = showDeployed || (showDraft && !deploymentUrl);
  // 사이트를 바꾸면 저장 전인 새 핀은 다른 사이트 위치라서 닫습니다.
  const [prevSite, setPrevSite] = useState(site);
  if (site !== prevSite) {
    setPrevSite(site);
    setDraftPin(null);
    setDeployedPath(null);
    setSiteHistory(EMPTY_SITE_HISTORY);
    setReload({ key: 0, path: null });
  }
  const draftPreview = useGetDraftPreviewHtml(projectId, showDraft ? draft : null);
  const commentsByPin = useGetPinCommentsByPin(
    projectId,
    getThreadPins(pins, showResolved).map((pin) => pin.id),
  );
  const canCreateRequest = can(project?.my_role, 'create-request-from-message');
  // 이미 수정 요청으로 등록된 메시지는 메뉴 대신 "등록됨"으로 표시합니다.
  const { data: requests = [] } = useGetChangeRequests(projectId, 'all');
  const registeredMessageIds = new Set(requests.map((request) => request.source_chat_message_id));
  const postPin = usePostPin(projectId);
  const postMessage = usePostMessage(projectId);
  const relocatePin = useRelocatePin(projectId);
  const { reportMissing, reportFound } = useReportPinLocation(projectId);

  const handleSubmitPin = (content: string) => {
    if (!draftPin?.anchor || !project) return;
    postPin.mutate(
      { role: project.my_role, ...draftPin.anchor, request_content: content },
      {
        onSuccess: ({ requestFailed }) => {
          setDraftPin(null);
          setNotice(
            requestFailed
              ? '핀은 저장했지만 수정 요청으로 등록하지 못했어요. 새로고침 후 확인해 주세요.'
              : null,
          );
        },
      },
    );
  };

  // 초안 미리보기와 핀 스크립트가 연결된 배포 사이트만 핀을 만들므로 요소 기준 앵커가 항상 있습니다.
  // 화면 좌표만으로는 스크롤하면 위치가 어긋나서 앵커 없는 위치는 받지 않습니다(FE#80).
  const handlePlacePin = (position: PinPosition) => {
    if (!position.anchor) return;
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
    setSelectedPin((prev) => ({ id: pinId, seq: (prev?.seq ?? 0) + 1 }));
  };

  // 배포 URL과 초안이 모두 없으면 백엔드가 409를 돌려줍니다.
  const pinErrorMessage = postPin.error
    ? postPin.error.code === 'CONFLICT'
      ? '배포 사이트나 초안이 있어야 핀을 남길 수 있어요.'
      : postPin.error.message
    : null;

  // 초안도 배포 URL도 없으면 핀 생성이 409이므로 핀 모드를 미리 막습니다.
  // 배포 사이트는 핀 스크립트가 연결돼야 핀 위치를 고정할 수 있어서, 연결 전과 없을 때도 막습니다.
  const pinDisabledReason =
    project && !project.deployment_url && draft === null
      ? '초안을 만들거나 배포 사이트를 연결하면 핀을 남길 수 있어요'
      : showDeployed && scriptStatus === 'connecting'
        ? '핀 스크립트 연결을 확인하고 있어요'
        : showDeployed && scriptStatus === 'disconnected'
          ? PIN_SCRIPT_MISSING_MESSAGE
          : null;
  const pinDisabledNotice =
    showDeployed && scriptStatus === 'disconnected' ? (
      <PinScriptMissingNotice projectId={projectId} />
    ) : undefined;
  const handlePinMissing = reportsLocation ? (id: string) => reportMissing(Number(id)) : undefined;
  const handlePinFound = reportsLocation ? (id: string) => reportFound(Number(id)) : undefined;

  const viewerPins = toViewerPins(pins, project?.my_role, showResolved);
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
  // 초안은 한 페이지만 미리 보여 주므로 페이지 목록이 없습니다.
  const address: SiteAddress | undefined =
    showDeployed && deploymentUrl
      ? {
          host: toDeploymentHost(deploymentUrl),
          path: currentPath,
          ...(isScriptConnected && { pages: toSitePages(viewerPins), onSelectPage: goToPath }),
        }
      : showDraft
        ? { host: '초안 미리보기', path: '/' }
        : undefined;
  const handleReload =
    showDeployed || showDraft
      ? () => setReload((prev) => ({ key: prev.key + 1, path: showDeployed ? currentPath : null }))
      : undefined;
  // 배포본의 "마지막 배포 · N일 전"은 백엔드 `deployment_updated_at`이 생기면 붙입니다.
  const footnote =
    showDraft && draft ? `초안 생성 · ${formatRelativeTime(draft.updated_at)}` : undefined;

  const startRelocate = (pinId: number) => {
    setDraftPin(null);
    relocatePin.start(pinId);
  };
  const relocatingNumber = pins.findIndex((pin) => pin.id === relocatePin.pinId) + 1;

  const pinPopover = (
    <PinCommentPopover
      onSubmit={handleSubmitPin}
      onCancel={() => setDraftPin(null)}
      isPending={postPin.isPending}
      errorMessage={pinErrorMessage}
    />
  );

  return (
    <WorkspaceLayout
      openKey={selectedPin}
      requestCount={getThreadPins(pins).length}
      latestMessageId={messagesLoaded ? (messages.at(-1)?.id ?? 0) : undefined}
      panel={
        <SideChatPanel
          projectId={projectId}
          selectedPin={selectedPin}
          messages={toMessages(messages, pins, members, me)}
          pinThreads={toPinThreads(pins, commentsByPin, members, me, requests, showResolved)}
          onSendMessage={(content) => postMessage.mutate({ content })}
          onSelectPin={handleSelectPin}
          onClosePin={() => setSelectedPin(null)}
          currentPath={showDeployed ? currentPath : showDraft ? '/' : null}
          otherPagesHref={`/projects/${projectId}/requests`}
          renderPinThreadAction={({ id }) => (
            <>
              {/* 재배포 후 핀 자리를 못 찾은 핀만 위치를 다시 지정합니다(같은 사이트 안에서). */}
              {pins.find((pin) => pin.id === Number(id))?.location_status === 'needs_check' && (
                <>
                  <PinLocationBadge />
                  <RelocatePinButton
                    isActive={relocatePin.pinId === Number(id)}
                    onClick={() => startRelocate(Number(id))}
                  />
                </>
              )}
              <SharePinButton projectId={projectId} pinId={Number(id)} />
            </>
          )}
          renderMessageAction={({ id, content }) => {
            if (!canCreateRequest || !content) return null;
            if (registeredMessageIds.has(Number(id))) {
              return <p className="text-faint text-xs font-semibold">수정 요청으로 등록됨</p>;
            }
            return (
              <MessageRequestMenu
                projectId={projectId}
                messageId={Number(id)}
                pins={toRequestPinOptions(pins)}
              />
            );
          }}
          role={project?.my_role}
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
          draftPinContent={pinPopover}
          pinDisabledReason={pinDisabledReason}
          pinDisabledNotice={pinDisabledNotice}
          address={address}
          history={history}
          onReload={handleReload}
          footnote={footnote}
          pinPrompt={
            relocatingNumber > 0 ? (
              <RelocatePinPrompt
                pinNumber={relocatingNumber}
                isPending={relocatePin.isPending}
                errorMessage={relocatePin.errorMessage}
                onCancel={relocatePin.cancel}
              />
            ) : undefined
          }
          showResolved={showResolved}
          onShowResolvedChange={setShowResolved}
          renderSite={
            showDeployed && frameUrl
              ? (mode) => (
                  <DeployedSiteFrame
                    key={`${deploymentUrl}#${reload.key}`}
                    url={frameUrl}
                    mode={mode}
                    pins={viewerPins}
                    focusPin={selectedPin}
                    navigateTo={navigation}
                    onPlacePin={handlePlacePin}
                    onSelectPin={handleSelectPin}
                    onPinMissing={handlePinMissing}
                    onPinFound={handlePinFound}
                    onPathChange={handlePathChange}
                    onStatusChange={setScriptStatus}
                    draftPin={draftPin}
                    draftPinContent={pinPopover}
                  />
                )
              : showDraft
                ? (mode) => (
                    <DraftPreviewFrame
                      key={reload.key}
                      html={draftPreview.data}
                      error={draftPreview.error}
                      mode={mode}
                      pins={viewerPins}
                      onPlacePin={handlePlacePin}
                      onSelectPin={handleSelectPin}
                      selectedPinId={selectedPin?.id ?? null}
                      draftPin={draftPin}
                      draftPinContent={pinPopover}
                      onPinMissing={handlePinMissing}
                      onPinFound={handlePinFound}
                    />
                  )
                : undefined
          }
        >
          {/* `false`를 넘기면 URL 문구 대신 빈칸이 되므로 undefined로 둡니다. */}
          {project && !project.deployment_url ? (
            <DeploymentEmptyState projectId={projectId} />
          ) : undefined}
        </SiteViewer>
        {notice && (
          <p
            role="alert"
            className="text-warn absolute top-4 left-1/2 z-30 -translate-x-1/2 rounded-[10px] bg-[#fff4e8] px-3.5 py-2 text-[13px] font-semibold"
          >
            {notice}
          </p>
        )}
      </main>
    </WorkspaceLayout>
  );
};

export default SiteViewerView;
