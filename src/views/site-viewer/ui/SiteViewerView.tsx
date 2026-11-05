'use client';

import { useState } from 'react';

import type { Message } from '@/entities/message';
import type { Device } from '@/features/switch-device';
import { SideChatPanel } from '@/widgets/side-chat';
import { type PinPosition, SiteViewer, type ViewerPin } from '@/widgets/site-viewer';
import { WorkspaceHeader } from '@/widgets/workspace-header';

import {
  MOCK_MESSAGES,
  MOCK_PARTICIPANTS,
  MOCK_PINS,
  MOCK_PROJECT,
  MOCK_REQUESTS,
} from '../model/mock';

const SiteViewerView = () => {
  const [device, setDevice] = useState<Device>('desktop');
  const [pins, setPins] = useState<ViewerPin[]>(MOCK_PINS);
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);

  const handlePlacePin = ({ x, y }: PinPosition) => {
    setPins((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        number: Math.max(0, ...prev.map((pin) => pin.number)) + 1,
        pagePath: '/products/detail',
        x,
        y,
      },
    ]);
  };

  const handleSendMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), authorName: '나', content, timeLabel: '방금' },
    ]);
  };

  return (
    <div className="flex h-full min-w-0 flex-1">
      <main className="bg-canvas shadow-elevation-2 relative flex h-full min-w-0 flex-1 flex-col">
        <SiteViewer
          url={MOCK_PROJECT.url}
          pins={pins}
          lastUpdatedLabel={MOCK_PROJECT.lastUpdatedLabel}
          onPlacePin={handlePlacePin}
        />
        <div className="absolute inset-x-0 top-0 z-20">
          <WorkspaceHeader
            projectName={MOCK_PROJECT.name}
            device={device}
            onDeviceChange={setDevice}
            participants={MOCK_PARTICIPANTS}
          />
        </div>
      </main>
      <SideChatPanel
        messages={messages}
        requests={MOCK_REQUESTS}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};

export default SiteViewerView;
