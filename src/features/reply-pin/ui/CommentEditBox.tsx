'use client';

import { type KeyboardEvent, useRef, useState } from 'react';

import { shake } from '@/shared/lib';
import { Button } from '@/shared/ui';

interface CommentEditBoxProps {
  initialValue: string;
  /** 성공하면 닫는 것은 호출한 쪽에서 합니다. 실패하면 입력한 내용을 그대로 둡니다. */
  onSave: (content: string) => Promise<unknown>;
  onCancel: () => void;
  isPending?: boolean;
}

/**
 * 말풍선 자리에 띄우는 내 답글 수정칸 (demo-design `.edit-box`).
 * Enter로 저장, Esc로 취소합니다. 비우면 흔들고, 그대로면 저장하지 않고 닫습니다.
 */
const CommentEditBox = ({
  initialValue,
  onSave,
  onCancel,
  isPending = false,
}: CommentEditBoxProps) => {
  const [content, setContent] = useState(initialValue);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const save = () => {
    const trimmed = content.trim();
    if (!trimmed) {
      shake(inputRef.current);
      return;
    }
    if (trimmed === initialValue.trim()) {
      onCancel();
      return;
    }
    if (!isPending) onSave(trimmed).catch(() => {});
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
      return;
    }
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    save();
  };

  return (
    <div className="grid w-[min(320px,100%)] gap-2">
      <textarea
        ref={inputRef}
        rows={2}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        onKeyDown={handleKeyDown}
        // 커서를 글 끝에 둡니다.
        onFocus={(event) => event.currentTarget.setSelectionRange(content.length, content.length)}
        autoFocus
        aria-label="답글 수정"
        className="border-ink text-ink w-full resize-none rounded-xl border px-3 py-2.5 text-sm leading-normal outline-none"
      />
      <div className="flex justify-end gap-1.5">
        <Button variant="secondary" size="sm" onClick={onCancel}>
          취소
        </Button>
        <Button size="sm" onClick={save} disabled={isPending}>
          저장
        </Button>
      </div>
    </div>
  );
};

export default CommentEditBox;
