'use client';

import { useEffect, useState } from 'react';

import type { Message } from '@/entities/message';
import { MessageInput } from '@/features/send-message';

import type { PinThread } from '../model/types';
import ChatMessageList from './ChatMessageList';
import PinThreadCard from './PinThreadCard';

type Tab = 'pins' | 'chat';

interface SideChatPanelProps {
  messages: Message[];
  pinThreads: PinThread[];
  onSendMessage: (content: string) => void;
}

const SideChatPanel = ({ messages, pinThreads, onSendMessage }: SideChatPanelProps) => {
  const [tab, setTab] = useState<Tab>('pins');
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id.startsWith('pin-')) {
      document.getElementById(id)?.scrollIntoView({ block: 'center' });
    }
  }, [pinThreads]);
  const tabs = [
    { value: 'pins', label: '요청', count: pinThreads.length },
    { value: 'chat', label: '대화', count: messages.length },
  ] as const;

  return (
    <aside className="border-divider flex h-full w-[420px] shrink-0 flex-col border-l bg-white">
      <div role="tablist" aria-label="패널 보기" className="flex gap-6 px-9 pt-8 pb-5">
        {tabs.map(({ value, label, count }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className="text-faint hover:text-text aria-selected:text-ink text-xl font-extrabold transition-colors"
          >
            {label}
            <span className="ml-1.5 text-sm font-semibold">{count}</span>
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        className="border-divider min-h-0 w-full flex-1 overflow-y-auto border-t"
      >
        {tab === 'chat' ? (
          <ChatMessageList messages={messages} />
        ) : pinThreads.length === 0 ? (
          <p className="text-muted px-9 py-7 text-sm leading-relaxed">
            남아 있는 요청이 없어요. 핀 모드에서 사이트를 눌러 요청을 남겨 보세요.
          </p>
        ) : (
          // 요청 사이를 회색 띠로 나눕니다.
          <ul className="bg-stage flex min-h-full flex-col gap-2">
            {pinThreads.map(({ id, ...thread }) => (
              <li key={id} id={`pin-${id}`}>
                <PinThreadCard {...thread} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-divider shrink-0 border-t px-9 pt-5 pb-8">
        <MessageInput onSend={onSendMessage} />
      </div>
    </aside>
  );
};

export default SideChatPanel;
