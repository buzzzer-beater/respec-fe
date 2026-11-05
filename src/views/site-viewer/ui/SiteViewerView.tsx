'use client';

import { useState } from 'react';

import { useGetMessages } from '@/entities/message';
import { useGetPinCommentsByPin, useGetPins } from '@/entities/pin';
import {
  useGetDraftPreviewHtml,
  useGetProject,
  useGetProjectDraft,
  useGetProjectMembers,
} from '@/entities/project';
import { useGetChangeRequests } from '@/entities/request';
import { can, useGetMe } from '@/entities/user';
import { DeploymentEmptyState } from '@/features/connect-deployment';
import { PinCommentPopover, usePostPin } from '@/features/create-pin';
import { MessageRequestMenu } from '@/features/create-request-from-message';
import { usePostMessage } from '@/features/send-message';
import { SharePinButton } from '@/features/share-pin';
import { type SelectedPin, SideChatPanel } from '@/widgets/side-chat';
import { DraftPreviewFrame, type PinPosition, SiteViewer } from '@/widgets/site-viewer';
import { WorkspaceLayout } from '@/widgets/workspace-layout';

import {
  getPagePath,
  getThreadPins,
  toMessages,
  toPinThreads,
  toRequestPinOptions,
  toViewerPins,
  VIEWER_ANCHOR_SELECTOR,
} from '../model/mappers';

interface SiteViewerViewProps {
  projectId: number;
}

const SiteViewerView = ({ projectId }: SiteViewerViewProps) => {
  const [draftPin, setDraftPin] = useState<PinPosition | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedPin, setSelectedPin] = useState<SelectedPin | null>(null);

  const { data: me } = useGetMe();
  const { data: project } = useGetProject(projectId);
  const { data: members = [] } = useGetProjectMembers(projectId);
  const { data: pins = [] } = useGetPins(projectId);
  const { data: messages = [], isSuccess: messagesLoaded } = useGetMessages(projectId);
  const { data: draft } = useGetProjectDraft(projectId);
  // 배포 URL이 없고 초안이 있으면 초안을 띄웁니다.
  const showDraft = !!project && !project.deployment_url && !!draft;
  const draftPreview = useGetDraftPreviewHtml(projectId, showDraft ? draft : null);
  const commentsByPin = useGetPinCommentsByPin(
    projectId,
    getThreadPins(pins).map((pin) => pin.id),
  );
  const canCreateRequest = can(project?.my_role, 'create-request-from-message');
  // 이미 수정 요청으로 등록된 메시지는 메뉴 대신 "등록됨"으로 표시합니다.
  const { data: requests = [] } = useGetChangeRequests(projectId, 'all');
  const registeredMessageIds = new Set(requests.map((request) => request.source_chat_message_id));
  const postPin = usePostPin(projectId);
  const postMessage = usePostMessage(projectId);

  const handleSubmitPin = (content: string) => {
    if (!draftPin || !project) return;
    // 초안은 요소 기준 앵커가 있고, 배포 사이트는 아직 영역 기준 좌표만 저장합니다.
    const anchor = draftPin.anchor ?? {
      page_path: getPagePath(project.deployment_url),
      element_selector: VIEWER_ANCHOR_SELECTOR,
      relative_x: draftPin.x / 100,
      relative_y: draftPin.y / 100,
    };
    postPin.mutate(
      { role: project.my_role, ...anchor, request_content: content },
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

  const handlePlacePin = (position: PinPosition) => {
    postPin.reset();
    setNotice(null);
    setDraftPin(position);
  };

  // 지금은 배포 사이트의 한 경로만 보여 줘서 경로 이동 없이 핀만 강조합니다.
  // 여러 경로를 보여 주게 되면 `pagePath`로 뷰어를 옮깁니다.
  // 같은 핀을 다시 눌러도 이동하도록 `seq`를 올립니다.
  const handleSelectPin = (pinId: string) =>
    setSelectedPin((prev) => ({ id: pinId, seq: (prev?.seq ?? 0) + 1 }));

  // 배포 URL과 초안이 모두 없으면 백엔드가 409를 돌려줍니다.
  const pinErrorMessage = postPin.error
    ? postPin.error.code === 'CONFLICT'
      ? '배포 사이트나 초안이 있어야 핀을 남길 수 있어요.'
      : postPin.error.message
    : null;

  // 초안도 배포 URL도 없으면 핀 생성이 409이므로 핀 모드를 미리 막습니다.
  const pinDisabledReason =
    project && !project.deployment_url && draft === null
      ? '초안을 만들거나 배포 사이트를 연결하면 핀을 남길 수 있어요'
      : null;

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
          pinThreads={toPinThreads(pins, commentsByPin, members, me)}
          onSendMessage={(content) => postMessage.mutate({ content })}
          onSelectPin={handleSelectPin}
          renderPinThreadAction={({ id }) => (
            <SharePinButton projectId={projectId} pinId={Number(id)} />
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
          url={project?.deployment_url ?? '배포 사이트가 아직 연결되지 않았어요'}
          pins={toViewerPins(pins)}
          selectedPinId={selectedPin?.id ?? null}
          onPlacePin={handlePlacePin}
          onSelectPin={handleSelectPin}
          draftPin={draftPin}
          draftPinContent={pinPopover}
          pinDisabledReason={pinDisabledReason}
          pagePath={
            project?.deployment_url || showDraft ? getPagePath(project?.deployment_url) : undefined
          }
          renderSite={
            showDraft
              ? (mode) => (
                  <DraftPreviewFrame
                    html={draftPreview.data}
                    error={draftPreview.error}
                    mode={mode}
                    pins={toViewerPins(pins)}
                    onPlacePin={handlePlacePin}
                    onSelectPin={handleSelectPin}
                    draftPin={draftPin}
                    draftPinContent={pinPopover}
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
