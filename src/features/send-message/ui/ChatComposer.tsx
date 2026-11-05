'use client';

import { type FormEvent, type KeyboardEvent, type Ref, useState } from 'react';

import { cn } from '@/shared/lib';
import { Icon, toast } from '@/shared/ui';

import { usePostMessage } from '../api/message';

interface ChatComposerProps {
  projectId: number;
  /** 서랍을 열 때 바로 입력하도록 포커스를 옮길 때 씁니다. */
  textareaRef?: Ref<HTMLTextAreaElement>;
  /** 보낸 뒤(맨 아래로 내리기 등) */
  onSent?: () => void;
  className?: string;
}

/**
 * 채팅 서랍 아래 입력창 (demo-design `.composer`). Enter로 보내고 Shift+Enter로 줄바꿈합니다.
 * 보내기 버튼은 결정 버튼(검정)과 겹치지 않게 회색이고, 비어 있으면 누를 수 없습니다.
 * 보내지 못하면 입력한 내용을 그대로 두고 안내합니다.
 */
const ChatComposer = ({ projectId, textareaRef, onSent, className }: ChatComposerProps) => {
  const [content, setContent] = useState('');
  const postMessage = usePostMessage(projectId);
  const trimmed = content.trim();

  const send = () => {
    if (!trimmed || postMessage.isPending) return;
    postMessage.mutate(
      { content: trimmed },
      {
        onSuccess: () => {
          setContent('');
          onSent?.();
        },
        onError: () => toast('메시지를 보내지 못했어요. 잠시 후 다시 시도해 주세요.'),
      },
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    send();
  };

  // 한글 조합 중 Enter는 무시합니다.
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    send();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'border-field focus-within:border-ink flex items-end gap-2 rounded-xl border py-1.5 pr-1.5 pl-3.5 transition-colors',
        className,
      )}
    >
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="메시지를 입력하세요"
        aria-label="메시지"
        className="text-ink placeholder:text-faint h-10 min-w-0 flex-1 resize-none bg-transparent pt-[9px] text-sm outline-none"
      />
      <button
        type="submit"
        aria-label="보내기"
        disabled={!trimmed || postMessage.isPending}
        className="bg-chip text-ink enabled:hover:bg-ink ease-spring disabled:bg-divider grid size-9 shrink-0 place-items-center rounded-[10px] transition-[transform,background-color,color] duration-300 active:scale-90 enabled:hover:text-white"
      >
        <Icon name="send" size={16} />
      </button>
    </form>
  );
};

export default ChatComposer;
