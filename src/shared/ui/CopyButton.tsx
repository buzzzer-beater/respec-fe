'use client';

import { type ComponentProps, type ReactNode, useEffect, useState } from 'react';

const COPIED_DURATION_MS = 2000;

interface CopyButtonProps extends Omit<ComponentProps<'button'>, 'onClick' | 'children'> {
  /** 클립보드에 넣을 글 */
  text: string;
  label?: ReactNode;
  /** 복사한 뒤 잠깐 보여 줄 문구 */
  copiedLabel?: ReactNode;
  /** 클립보드 권한이 없을 때. 사용자가 직접 복사할 수 있게 글을 선택해 두는 데 씁니다. */
  onCopyError?: () => void;
}

/** 글을 클립보드에 복사하는 버튼. 모양은 className으로 정합니다. */
export const CopyButton = ({
  text,
  label = '복사',
  copiedLabel = '복사했어요',
  onCopyError,
  type = 'button',
  ...props
}: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), COPIED_DURATION_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      onCopyError?.();
    }
  };

  return (
    <button type={type} onClick={handleCopy} {...props}>
      {copied ? copiedLabel : label}
    </button>
  );
};
