import { PinNumberBadge } from '@/entities/pin';

import type { SharedPin } from '../model/types';

interface SharedPinCardProps {
  pin: SharedPin;
  onOpen: (pinId: string, pagePath: string) => void;
}

const cardClassName =
  'border-divider mt-2.5 flex w-full max-w-[300px] items-center gap-2.5 rounded-[10px] border bg-white px-3 py-2.5 text-left text-[13px]';

/** 채팅에 공유된 핀 카드 (demo-design `.shared`). 누르면 서랍을 닫고 그 핀의 요청 상세로 갑니다. */
const SharedPinCard = ({ pin, onOpen }: SharedPinCardProps) => {
  const { id, pinNumber, pagePath, preview } = pin;

  if (pinNumber === null || pagePath === null) {
    return <div className={`${cardClassName} text-faint`}>삭제된 핀이에요</div>;
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(id, pagePath)}
      aria-label={`핀 ${pinNumber}으로 이동`}
      className={`${cardClassName} text-text hover:border-ink transition-colors`}
    >
      <PinNumberBadge number={pinNumber} />
      <span className="min-w-0 truncate">{preview ?? '요청 내용이 삭제됐어요.'}</span>
    </button>
  );
};

export default SharedPinCard;
