'use client';

import type { ComponentProps, ReactNode } from 'react';

import { toast } from './Toast';

const COPY_FAILED_MESSAGE = '복사하지 못했어요. 직접 선택해서 복사해 주세요';

interface CopyButtonProps extends Omit<ComponentProps<'button'>, 'onClick' | 'children'> {
  /** 클립보드에 넣을 글 */
  text: string;
  label?: ReactNode;
  /** 복사한 뒤 띄울 안내 */
  copiedMessage?: string;
  /** 클립보드 권한이 없을 때. 사용자가 직접 복사할 수 있게 글을 선택해 두는 데 씁니다. */
  onCopyError?: () => void;
}

/** 글을 클립보드에 복사하고 결과를 아래 안내(toast)로 알려 주는 버튼. 모양은 className으로 정합니다. */
export const CopyButton = ({
  text,
  label = '복사',
  copiedMessage = '복사했어요',
  onCopyError,
  type = 'button',
  ...props
}: CopyButtonProps) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast(copiedMessage);
    } catch {
      toast(COPY_FAILED_MESSAGE);
      onCopyError?.();
    }
  };

  return (
    <button type={type} onClick={handleCopy} {...props}>
      {label}
    </button>
  );
};
