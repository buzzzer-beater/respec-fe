'use client';

import { useState } from 'react';

import { useGetMessages } from '@/entities/message';
import { useGetPins } from '@/entities/pin';
import { useGetProject, useGetProjectMembers } from '@/entities/project';
import { useGetChangeRequests } from '@/entities/request';
import { useGetMe } from '@/entities/user';
import { PinCommentPopover, usePostPin } from '@/features/create-pin';
import { usePostMessage } from '@/features/send-message';
import type { Device } from '@/features/switch-device';
import { SideChatPanel } from '@/widgets/side-chat';
import { type PinPosition, SiteViewer } from '@/widgets/site-viewer';
import { WorkspaceHeader } from '@/widgets/workspace-header';

import {
  getPagePath,
  toMessages,
  toParticipants,
  toRequestCards,
  toViewerPins,
  VIEWER_ANCHOR_SELECTOR,
} from '../model/mappers';

interface SiteViewerViewProps {
  projectId: number;
}

const SiteViewerView = ({ projectId }: SiteViewerViewProps) => {
  const [device, setDevice] = useState<Device>('desktop');
  const [draftPin, setDraftPin] = useState<PinPosition | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const { data: me } = useGetMe();
  const { data: project } = useGetProject(projectId);
  const { data: members = [] } = useGetProjectMembers(projectId);
  const { data: pins = [] } = useGetPins(projectId);
  const { data: messages = [] } = useGetMessages(projectId);
  const { data: requests = [] } = useGetChangeRequests(projectId);
  const postPin = usePostPin(projectId);
  const postMessage = usePostMessage(projectId);

  const handleSubmitPin = (content: string) => {
    if (!draftPin || !project) return;
    postPin.mutate(
      {
        role: project.my_role,
        page_path: getPagePath(project.deployment_url),
        element_selector: VIEWER_ANCHOR_SELECTOR,
        relative_x: draftPin.x / 100,
        relative_y: draftPin.y / 100,
        request_content: content,
      },
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

  // 배포 URL과 초안이 모두 없으면 백엔드가 409를 돌려줍니다.
  const pinErrorMessage = postPin.error
    ? postPin.error.code === 'CONFLICT'
      ? '배포 사이트나 초안이 있어야 핀을 남길 수 있어요.'
      : postPin.error.message
    : null;

  return (
    <div className="flex h-full min-w-0 flex-1">
      <main className="bg-canvas shadow-elevation-2 relative flex h-full min-w-0 flex-1 flex-col">
        <SiteViewer
          url={project?.deployment_url ?? '배포 사이트가 아직 연결되지 않았어요'}
          pins={toViewerPins(pins)}
          onPlacePin={handlePlacePin}
          draftPin={draftPin}
          draftPinContent={
            <PinCommentPopover
              onSubmit={handleSubmitPin}
              onCancel={() => setDraftPin(null)}
              isPending={postPin.isPending}
              errorMessage={pinErrorMessage}
            />
          }
        />
        <div className="absolute inset-x-0 top-0 z-20">
          <WorkspaceHeader
            projectName={project?.name ?? ''}
            device={device}
            onDeviceChange={setDevice}
            participants={toParticipants(members, me)}
          />
        </div>
        {notice && (
          <p
            role="alert"
            className="rounded-xsmall shadow-elevation-2 text-danger absolute top-20 left-1/2 z-30 -translate-x-1/2 bg-white px-4 py-2 text-sm"
          >
            {notice}
          </p>
        )}
      </main>
      <SideChatPanel
        messages={toMessages(messages, pins, members, me)}
        requests={toRequestCards(requests, pins, members, me)}
        onSendMessage={(content) => postMessage.mutate({ content })}
      />
    </div>
  );
};

export default SiteViewerView;
