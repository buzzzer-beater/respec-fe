'use client';

import { type ComponentProps, useState } from 'react';

import Image from 'next/image';

import type { Message } from '@/entities/message';
import { RequestCard } from '@/entities/request';
import { MessageInput } from '@/features/send-message';

import chatIcon from '../assets/chat.svg';
import chatActiveIcon from '../assets/chat-active.svg';
import pinIcon from '../assets/pin.svg';
import pinActiveIcon from '../assets/pin-active.svg';
import ChatMessageList from './ChatMessageList';

type Tab = 'chat' | 'pins';
type SideChatRequest = ComponentProps<typeof RequestCard> & { id: string };

const TABS = [
  { value: 'chat', label: '채팅', icon: chatIcon, activeIcon: chatActiveIcon },
  { value: 'pins', label: '핀 요청', icon: pinIcon, activeIcon: pinActiveIcon },
] as const;

interface SideChatPanelProps {
  messages: Message[];
  requests: SideChatRequest[];
  onSendMessage: (content: string) => void;
}

const SideChatPanel = ({ messages, requests, onSendMessage }: SideChatPanelProps) => {
  const [tab, setTab] = useState<Tab>('chat');

  return (
    <aside className="flex h-full w-[400px] shrink-0 flex-col items-center gap-5 overflow-clip pb-9">
      <header className="border-line-strong flex h-16 w-full shrink-0 items-center justify-between border-b px-7 py-4">
        <h2 className="text-ink-800 text-lg leading-[normal] font-medium">채널</h2>
        <div role="tablist" aria-label="채널 보기" className="flex items-center gap-3">
          {TABS.map(({ value, label, icon, activeIcon }) => {
            const isSelected = tab === value;

            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-label={label}
                onClick={() => setTab(value)}
              >
                <Image
                  src={isSelected ? activeIcon : icon}
                  alt=""
                  width={28}
                  height={28}
                  unoptimized
                />
              </button>
            );
          })}
        </div>
      </header>

      <div role="tabpanel" className="min-h-0 w-full flex-1 overflow-y-auto">
        {tab === 'chat' ? (
          <ChatMessageList messages={messages} />
        ) : (
          <ul className="flex w-full flex-col gap-4 px-7">
            {requests.map(({ id, ...request }) => (
              <li key={id}>
                <RequestCard {...request} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="w-full shrink-0 px-6">
        <MessageInput onSend={onSendMessage} />
      </div>
    </aside>
  );
};

export default SideChatPanel;
