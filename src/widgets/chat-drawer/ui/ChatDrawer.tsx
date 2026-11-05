'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';

import { MessageItem } from '@/entities/message';
import type { ChangeRequest } from '@/entities/request';
import { PROJECT_ROLE_LABEL, RoleAvatar } from '@/entities/user';
import { RequestFromMessageButton } from '@/features/create-request-from-message';
import { ChatComposer } from '@/features/send-message';
import { cn } from '@/shared/lib';
import { AiPlainText, Icon, IconButton } from '@/shared/ui';

import type { ChatDrawerMessage } from '../model/types';
import SharedPinCard from './SharedPinCard';

/** 맨 아래에서 이 거리(px) 안이면 맨 아래에 있는 것으로 봅니다. */
const BOTTOM_THRESHOLD = 48;

interface ChatDrawerProps {
  projectId: number;
  isOpen: boolean;
  onClose: () => void;
  /** 머리글 아래 "{프로젝트 이름} · {참여자 이메일}" */
  projectName: string;
  memberEmails: string[];
  messages: ChatDrawerMessage[];
  /** 고객이면 말풍선 아래에 "요청으로 등록"을 둡니다. */
  canCreateRequest: boolean;
  /** 공유된 핀 카드를 눌렀을 때. 서랍은 먼저 닫습니다. */
  onOpenSharedPin: (pinId: string, pagePath: string) => void;
  /** 메시지를 요청으로 등록한 뒤. 서랍은 먼저 닫습니다(그 요청 상세 열기 등). */
  onRequestCreated?: (request: ChangeRequest) => void;
}

/**
 * 오른쪽에서 밀려 나오는 채팅 서랍 (demo-design `.drawer`). 상단바(84px) 아래를 덮고 × 와 Esc로 닫습니다.
 * 프로젝트 하나에 채팅방 하나입니다. AI 풀이는 접어 두고, 핀 카드는 눌러 요청 상세로 갑니다.
 */
const ChatDrawer = ({
  projectId,
  isOpen,
  onClose,
  projectName,
  memberEmails,
  messages,
  canCreateRequest,
  onOpenSharedPin,
  onRequestCreated,
}: ChatDrawerProps) => {
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isAtBottomRef = useRef(true);
  const lastMessage = messages.at(-1);
  const lastId = lastMessage?.id;
  const isLastMine = lastMessage?.isMine ?? false;

  const scrollToBottom = () => bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });

  // 열 때는 맨 아래로 내리고 바로 입력하도록 포커스를 옮깁니다.
  useLayoutEffect(() => {
    if (!isOpen) return;
    isAtBottomRef.current = true;
    scrollToBottom();
    inputRef.current?.focus({ preventScroll: true });
  }, [isOpen]);

  // 새 메시지가 오면 내립니다. 위로 올려 읽는 중이면 그대로 두고, 내가 보낸 메시지는 항상 내립니다.
  useLayoutEffect(() => {
    if (isAtBottomRef.current || isLastMine) scrollToBottom();
  }, [lastId, isLastMine]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.isComposing) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleScroll = () => {
    const element = bodyRef.current;
    if (!element) return;
    isAtBottomRef.current =
      element.scrollHeight - element.scrollTop - element.clientHeight < BOTTOM_THRESHOLD;
  };

  const people = [projectName, memberEmails.join(', ')].filter(Boolean).join(' · ');

  return (
    <aside
      id="chat-drawer"
      aria-label="채팅"
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={cn(
        'ease-out-soft fixed top-[84px] right-0 bottom-0 z-20 flex w-[460px] max-w-full flex-col border-l border-[#e2e2e7] bg-white shadow-[-16px_0_40px_rgba(24,24,27,0.1)] transition-transform duration-400',
        !isOpen && 'translate-x-[calc(100%+40px)]',
      )}
    >
      <div className="border-divider flex items-center justify-between gap-3 border-b pt-7 pr-7 pb-6 pl-9">
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold">채팅</h2>
          <p className="text-muted mt-0.5 truncate text-[13px]">{people}</p>
        </div>
        <IconButton aria-label="채팅 닫기" onClick={onClose}>
          <Icon name="x" size={18} />
        </IconButton>
      </div>

      <div
        ref={bodyRef}
        onScroll={handleScroll}
        className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-9 py-7"
      >
        {messages.length === 0 ? (
          <p className="text-muted text-[13px]">아직 대화가 없어요.</p>
        ) : (
          messages.map((message) => (
            <MessageItem
              key={message.id}
              isMine={message.isMine}
              avatar={<RoleAvatar name={message.authorName} role={message.authorRole} size={28} />}
              authorName={message.authorName}
              authorLabel={PROJECT_ROLE_LABEL[message.authorRole]}
              timeLabel={message.timeLabel}
              content={message.content}
              className="max-w-[85%] shrink-0"
            >
              {message.content && (
                <AiPlainText
                  plainText={message.plainText}
                  status={message.aiStatus}
                  label={message.authorRole === 'developer' ? '쉬운 풀이' : '개발자용 정리'}
                />
              )}
              {message.sharedPin && (
                <SharedPinCard
                  pin={message.sharedPin}
                  onOpen={(pinId, pagePath) => {
                    onClose();
                    onOpenSharedPin(pinId, pagePath);
                  }}
                />
              )}
              {canCreateRequest && message.content && !message.isRegistered && (
                <RequestFromMessageButton
                  projectId={projectId}
                  messageId={Number(message.id)}
                  onCreated={(request) => {
                    onClose();
                    onRequestCreated?.(request);
                  }}
                />
              )}
            </MessageItem>
          ))
        )}
      </div>

      <ChatComposer
        projectId={projectId}
        textareaRef={inputRef}
        onSent={() => {
          isAtBottomRef.current = true;
        }}
        className="mx-9 mb-8"
      />
    </aside>
  );
};

export default ChatDrawer;
