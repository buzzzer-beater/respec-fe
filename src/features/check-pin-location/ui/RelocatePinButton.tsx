'use client';

interface RelocatePinButtonProps {
  onClick: () => void;
  /** 지금 이 핀의 위치를 다시 지정하는 중 */
  isActive?: boolean;
}

/** 핀 스레드에서 핀 위치를 다시 지정하기 시작합니다. */
const RelocatePinButton = ({ onClick, isActive = false }: RelocatePinButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={isActive}
    className="text-muted hover:text-ink hover:bg-hover rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors disabled:opacity-50"
  >
    {isActive ? '지정 중' : '위치 다시 지정'}
  </button>
);

export default RelocatePinButton;
