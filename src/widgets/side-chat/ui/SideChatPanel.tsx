'use client';

import { type ReactNode, useEffect, useEffectEvent, useRef, useState } from 'react';

import type { ProjectRole } from '@/entities/user';
import { MessageInput } from '@/features/send-message';

import type { PinThread, SideChatMessage } from '../model/types';
import ChatMessageList from './ChatMessageList';
import PageRequestList from './PageRequestList';
import PinThreadCard from './PinThreadCard';

type Tab = 'pins' | 'chat';

/** 사이트에서 고른 핀. 같은 핀을 다시 눌러도 이동하도록 `seq`를 올립니다. */
export interface SelectedPin {
  id: string;
  seq: number;
}

interface SideChatPanelProps {
  projectId: number;
  messages: SideChatMessage[];
  pinThreads: PinThread[];
  onSendMessage: (content: string) => void;
  selectedPin?: SelectedPin | null;
  /** 요청 목록이나 공유된 핀 카드에서 핀을 골랐을 때. 다른 경로의 핀이면 `pagePath`로 뷰어를 옮깁니다. */
  onSelectPin?: (pinId: string, pagePath: string) => void;
  /** 요청 상세에서 목록으로 돌아갈 때(고른 핀 해제) */
  onClosePin?: () => void;
  /** 지금 사이트에서 보고 있는 페이지. 요청 목록을 이 페이지 기준으로 나눕니다. */
  currentPath?: string | null;
  /** "다른 페이지 요청 N개 보기"로 갈 주소 */
  otherPagesHref?: string;
  renderPinThreadAction?: (thread: PinThread) => ReactNode;
  renderMessageAction?: (message: SideChatMessage) => ReactNode;
  /** 있으면 핀 스레드에 역할에 맞는 상태 버튼을 보여 줍니다. */
  role?: ProjectRole;
}

const SideChatPanel = ({
  projectId,
  messages,
  pinThreads,
  onSendMessage,
  selectedPin,
  onSelectPin,
  onClosePin,
  currentPath = null,
  otherPagesHref,
  renderPinThreadAction,
  renderMessageAction,
  role,
}: SideChatPanelProps) => {
  const [tab, setTab] = useState<Tab>('pins');

  // 핀을 고르면 요청 탭으로 바꿉니다. 렌더 중에 이전 선택과 비교해 한 번만 바꿉니다.
  const [prevSelectedPin, setPrevSelectedPin] = useState(selectedPin);
  if (selectedPin !== prevSelectedPin) {
    setPrevSelectedPin(selectedPin);
    if (selectedPin) setTab('pins');
  }

  // 고른 핀이 있으면 요청 탭에서 목록 대신 그 요청의 상세(스레드)를 보여 줍니다.
  const selectedThread = selectedPin
    ? pinThreads.find((thread) => thread.id === selectedPin.id)
    : undefined;

  // 공유된 핀 카드는 부모가 선택을 바꾸면 요청 탭의 상세로 이동합니다.
  const handleOpenSharedPin = (pinId: string, pagePath: string) => onSelectPin?.(pinId, pagePath);

  // 주소의 `#pin-{id}`(요청 관리의 "핀으로 이동")는 스레드가 처음 보일 때 한 번만 엽니다.
  const openedHashRef = useRef<string | null>(null);
  const openHashPin = useEffectEvent(() => {
    const hash = window.location.hash.slice(1);
    if (!hash.startsWith('pin-') || openedHashRef.current === hash) return;
    const thread = pinThreads.find((item) => `pin-${item.id}` === hash);
    if (!thread) return;
    openedHashRef.current = hash;
    onSelectPin?.(thread.id, thread.pagePath);
  });
  useEffect(() => openHashPin(), [pinThreads]);
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
        ) : selectedThread ? (
          <div id={`pin-${selectedThread.id}`} className="flex flex-col">
            <button
              type="button"
              onClick={onClosePin}
              className="text-muted hover:text-ink flex items-center gap-1 self-start px-9 pt-5 text-sm font-semibold"
            >
              <span aria-hidden>‹</span> 요청 목록
            </button>
            <PinThreadCard
              key={selectedThread.id}
              projectId={projectId}
              role={role}
              {...selectedThread}
              action={renderPinThreadAction?.(selectedThread)}
            />
          </div>
        ) : (
          <PageRequestList
            threads={pinThreads}
            currentPath={currentPath}
            role={role}
            onSelect={(thread) => onSelectPin?.(thread.id, thread.pagePath)}
            otherPagesHref={otherPagesHref}
          />
        )}
      </div>

      {/* 요청 상세에는 답글 입력창이 있어서, 채팅 입력창은 대화 탭에서만 보여 줍니다. */}
      {tab === 'chat' && (
        <div className="border-divider shrink-0 border-t px-9 pt-5 pb-8">
          <MessageInput onSend={onSendMessage} />
        </div>
      )}
    </aside>
  );
};

export default SideChatPanel;
