'use client';

import { useEffect } from 'react';

interface RelocatePinPromptProps {
  pinNumber: number;
  isPending: boolean;
  errorMessage: string | null;
  onCancel: () => void;
}

/** 위치 다시 지정 중에 핀 모드 안내 대신 보여 줍니다. Esc로도 취소합니다. */
const RelocatePinPrompt = ({
  pinNumber,
  isPending,
  errorMessage,
  onCancel,
}: RelocatePinPromptProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div
      role="status"
      className="bg-ink flex items-center gap-3 rounded-[10px] py-1.5 pr-1.5 pl-3.5 text-[13px] font-semibold whitespace-nowrap text-white"
    >
      <span>
        {isPending
          ? `${pinNumber}번 핀을 옮기는 중이에요`
          : (errorMessage ?? `${pinNumber}번 핀의 새 위치를 눌러 주세요`)}
      </span>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-[8px] bg-white/15 px-2.5 py-1 text-xs font-bold transition-colors hover:bg-white/25"
      >
        취소
      </button>
    </div>
  );
};

export default RelocatePinPrompt;
