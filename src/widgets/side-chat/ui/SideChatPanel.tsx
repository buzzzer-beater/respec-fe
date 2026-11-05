'use client';

import { type ReactNode, useEffect, useState } from 'react';

import { MessageInput } from '@/features/send-message';
import { cn } from '@/shared/lib';

import type { PinThread, SideChatMessage } from '../model/types';
import ChatMessageList from './ChatMessageList';
import PinThreadCard from './PinThreadCard';

type Tab = 'pins' | 'chat';

interface SideChatPanelProps {
  messages: SideChatMessage[];
  pinThreads: PinThread[];
  onSendMessage: (content: string) => void;
  /** 선택된 핀. 바뀌면 요청 탭의 해당 스레드로 이동합니다. */
  selectedPinId?: string | null;
  /** 공유된 핀 카드를 눌렀을 때. 다른 경로의 핀이면 `pagePath`로 뷰어를 옮깁니다. */
  onSelectPin?: (pinId: string, pagePath: string) => void;
  renderPinThreadAction?: (thread: PinThread) => ReactNode;
  renderMessageAction?: (message: SideChatMessage) => ReactNode;
}

const SideChatPanel = ({
  messages,
  pinThreads,
  onSendMessage,
  selectedPinId,
  onSelectPin,
  renderPinThreadAction,
  renderMessageAction,
}: SideChatPanelProps) => {
  const [tab, setTab] = useState<Tab>('pins');
  const [scrollTarget, setScrollTarget] = useState<{ pinId: string } | null>(null);
  const [prevSelectedPinId, setPrevSelectedPinId] = useState(selectedPinId);

  // 요청 탭으로 바꾸고 렌더링이 끝나면 해당 스레드로 스크롤합니다. 같은 핀을 다시 눌러도 스크롤되도록 매번 새 객체를 둡니다.
  const focusPin = (pinId: string) => {
    setTab('pins');
    setScrollTarget({ pinId });
  };
  if (selectedPinId !== prevSelectedPinId) {
    setPrevSelectedPinId(selectedPinId);
    if (selectedPinId) focusPin(selectedPinId);
  }
  useEffect(() => {
    if (!scrollTarget) return;
    document
      .getElementById(`pin-${scrollTarget.pinId}`)
      ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [scrollTarget]);

  const handleOpenSharedPin = (pinId: string, pagePath: string) => {
    focusPin(pinId);
    onSelectPin?.(pinId, pagePath);
  };

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
          <ChatMessageList
            messages={messages}
            onOpenSharedPin={handleOpenSharedPin}
            renderMessageAction={renderMessageAction}
          />
        ) : pinThreads.length === 0 ? (
          <p className="text-muted px-9 py-7 text-sm leading-relaxed">
            남아 있는 요청이 없어요. 핀 모드에서 사이트를 눌러 요청을 남겨 보세요.
          </p>
        ) : (
          // 요청 사이를 회색 띠로 나눕니다.
          <ul className="bg-stage flex min-h-full flex-col gap-2">
            {pinThreads.map(({ id, ...thread }) => (
              <li
                key={id}
                id={`pin-${id}`}
                aria-current={selectedPinId === id || undefined}
                className={cn(selectedPinId === id && 'outline-brand outline-2 -outline-offset-2')}
              >
                <PinThreadCard {...thread} action={renderPinThreadAction?.({ id, ...thread })} />
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
