'use client';

import { useSharePin } from '../api/share-pin';

interface SharePinButtonProps {
  projectId: number;
  pinId: number;
}

/** 핀 스레드의 핀을 대화 탭에 카드로 공유합니다. */
const SharePinButton = ({ projectId, pinId }: SharePinButtonProps) => {
  const sharePin = useSharePin(projectId);
  const label = sharePin.isPending
    ? '공유 중'
    : sharePin.isError
      ? '다시 공유'
      : sharePin.isSuccess
        ? '공유했어요'
        : '대화에 공유';

  return (
    <button
      type="button"
      onClick={() => sharePin.mutate(pinId)}
      disabled={sharePin.isPending}
      title={sharePin.isError ? '공유하지 못했어요. 다시 시도해 주세요.' : undefined}
      className="text-muted hover:text-ink hover:bg-hover rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors disabled:opacity-50"
    >
      {label}
    </button>
  );
};

export default SharePinButton;
