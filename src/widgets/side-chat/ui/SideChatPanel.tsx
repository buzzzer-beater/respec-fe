'use client';

import { useEffect, useRef, useState } from 'react';

import type { Message } from '@/entities/message';
import type { ProjectRole } from '@/entities/user';
import { MessageInput } from '@/features/send-message';

import type { PinThread } from '../model/types';
import ChatMessageList from './ChatMessageList';
import PinThreadCard from './PinThreadCard';

type Tab = 'pins' | 'chat';

/** 사이트에서 고른 핀. 같은 핀을 다시 눌러도 이동하도록 `seq`를 올립니다. */
export interface SelectedPin {
  id: string;
  seq: number;
}

interface SideChatPanelProps {
  projectId: number;
  messages: Message[];
  pinThreads: PinThread[];
  onSendMessage: (content: string) => void;
  selectedPin?: SelectedPin | null;
  /** 있으면 핀 스레드에 역할에 맞는 상태 버튼을 보여 줍니다. */
  role?: ProjectRole;
}

const SideChatPanel = ({
  projectId,
  messages,
  pinThreads,
  onSendMessage,
  selectedPin,
  role,
}: SideChatPanelProps) => {
  const [tab, setTab] = useState<Tab>('pins');

  // 핀을 고르면 요청 탭으로 바꿉니다. 렌더 중에 이전 선택과 비교해 한 번만 바꿉니다.
  const [prevSelectedPin, setPrevSelectedPin] = useState(selectedPin);
  if (selectedPin !== prevSelectedPin) {
    setPrevSelectedPin(selectedPin);
    if (selectedPin) setTab('pins');
  }

  // 고른 핀의 스레드로 스크롤하고 잠깐 강조합니다.
  useEffect(() => {
    if (!selectedPin) return;
    const thread = document.getElementById(`pin-${selectedPin.id}`);
    if (!thread) return;
    thread.scrollIntoView({ block: 'center', behavior: 'smooth' });
    thread.firstElementChild?.animate(
      [{ backgroundColor: '#ecebfd' }, { backgroundColor: '#ffffff' }],
      { duration: 1600, easing: 'ease-out' },
    );
  }, [selectedPin]);

  // 주소의 `#pin-{id}`로는 스레드가 처음 보일 때 한 번만 스크롤합니다.
  // 폴링으로 다시 그릴 때마다 스크롤하면 답글을 쓰는 중에 화면이 튑니다.
  const scrolledHashRef = useRef<string | null>(null);
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id.startsWith('pin-') || scrolledHashRef.current === id) return;
    const thread = document.getElementById(id);
    // 댓글을 아직 못 받아 카드가 비어 있으면 다음에 다시 시도합니다.
    if (!thread?.firstElementChild) return;
    thread.scrollIntoView({ block: 'center' });
    scrolledHashRef.current = id;
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
            {pinThreads.map((thread) => (
              <li key={thread.id} id={`pin-${thread.id}`}>
                <PinThreadCard projectId={projectId} role={role} {...thread} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 요청 탭에서는 카드마다 답글 입력창이 있어서, 채팅 입력창은 대화 탭에서만 보여 줍니다. */}
      {tab === 'chat' && (
        <div className="border-divider shrink-0 border-t px-9 pt-5 pb-8">
          <MessageInput onSend={onSendMessage} />
        </div>
      )}
    </aside>
  );
};

export default SideChatPanel;
