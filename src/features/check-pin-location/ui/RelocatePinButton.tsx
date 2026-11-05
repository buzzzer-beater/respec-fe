'use client';

import { cn } from '@/shared/lib';

interface RelocatePinButtonProps {
  onClick: () => void;
  /** 지금 이 핀의 위치를 다시 지정하는 중. 이때는 "취소"로 바뀌고 `onCancel`을 부릅니다. */
  isActive?: boolean;
  onCancel?: () => void;
  className?: string;
}

/**
 * 핀 자리를 못 찾았을 때 위치를 다시 지정하기 시작하는 버튼(demo-design `.lost button`).
 * 주황 안내 상자 오른쪽 끝에 두는 밑줄 글자 버튼입니다.
 */
const RelocatePinButton = ({
  onClick,
  isActive = false,
  onCancel,
  className,
}: RelocatePinButtonProps) => (
  <button
    type="button"
    onClick={isActive ? onCancel : onClick}
    className={cn(
      'text-warn-strong ml-auto text-[13px] font-extrabold whitespace-nowrap underline underline-offset-[3px]',
      className,
    )}
  >
    {isActive ? '취소' : '위치 다시 지정'}
  </button>
);

export default RelocatePinButton;
