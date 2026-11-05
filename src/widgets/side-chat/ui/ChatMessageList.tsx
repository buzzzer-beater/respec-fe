'use client';

import { type ReactNode, useLayoutEffect, useRef, useState } from 'react';

import { MessageItem } from '@/entities/message';
import { cn } from '@/shared/lib';

import type { SideChatMessage } from '../model/types';
import SharedPinCard from './SharedPinCard';

/** 맨 아래에서 이 거리(px) 안이면 맨 아래에 있는 것으로 봅니다. */
const BOTTOM_THRESHOLD = 48;

const scrollToBottom = (element: HTMLElement | null, behavior: ScrollBehavior = 'auto') =>
  element?.scrollTo({ top: element.scrollHeight, behavior });

interface ChatMessageListProps {
  messages: SideChatMessage[];
  /** 공유된 핀 카드를 눌렀을 때 */
  onOpenSharedPin?: (pinId: string, pagePath: string) => void;
  /** 메시지 아래에 붙일 액션(수정 요청으로 등록 등) */
  renderMessageAction?: (message: SideChatMessage) => ReactNode;
}

const ChatMessageList = ({
  messages,
  onOpenSharedPin,
  renderMessageAction,
}: ChatMessageListProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const lastMessage = messages.at(-1);
  const lastId = lastMessage?.id;
  const isLastMine = lastMessage?.isMine ?? false;
  const [seenLastId, setSeenLastId] = useState(lastId);

  // 탭을 열 때와 새 메시지가 올 때 맨 아래로 내립니다.
  // 위로 올려 읽는 중이면 내리지 않고 "새 메시지" 버튼을 띄웁니다. 내가 보낸 메시지는 항상 내립니다.
  useLayoutEffect(() => {
    if (isAtBottomRef.current || isLastMine) scrollToBottom(scrollRef.current);
  }, [lastId, isLastMine]);

  const handleScroll = () => {
    const element = scrollRef.current;
    if (!element) return;
    const atBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight < BOTTOM_THRESHOLD;
    isAtBottomRef.current = atBottom;
    setIsAtBottom(atBottom);
    if (atBottom) setSeenLastId(lastId);
  };

  const hasUnseen = !isAtBottom && lastId !== seenLastId;

  return (
    <div className="relative h-full">
      <div ref={scrollRef} onScroll={handleScroll} className="h-full overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-muted px-9 py-7 text-sm">아직 나눈 대화가 없어요.</p>
        ) : (
          <ul className="flex w-full flex-col gap-5 px-9 py-7">
            {messages.map((message) => {
              const { id, sharedPin, ...rest } = message;
              const action = renderMessageAction?.(message);
              return (
                <li key={id} className="group flex flex-col">
                  <MessageItem {...rest}>
                    {sharedPin && <SharedPinCard pin={sharedPin} onOpen={onOpenSharedPin} />}
                  </MessageItem>
                  {action && (
                    <div
                      className={cn('mt-1.5', rest.isMine ? 'mr-9 self-end' : 'ml-9 self-start')}
                    >
                      {action}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {hasUnseen && (
        <button
          type="button"
          onClick={() => scrollToBottom(scrollRef.current, 'smooth')}
          className="bg-ink absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-3.5 py-2 text-[13px] font-semibold text-white shadow-[0_4px_14px_rgba(24,24,27,0.18)]"
        >
          새 메시지 ↓
        </button>
      )}
    </div>
  );
};

export default ChatMessageList;
