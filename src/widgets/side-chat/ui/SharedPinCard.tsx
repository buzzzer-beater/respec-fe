import { CHANGE_REQUEST_STATUS_LABEL, RequestStatusBadge } from '@/entities/request';

import type { SharedPin } from '../model/types';

interface SharedPinCardProps {
  pin: SharedPin;
  onOpen?: (pinId: string, pagePath: string) => void;
}

/** 채팅에 공유된 핀 카드. 누르면 해당 핀과 코멘트 스레드로 이동합니다. */
const SharedPinCard = ({ pin, onOpen }: SharedPinCardProps) => {
  const { id, pinNumber, pagePath, preview, status } = pin;

  if (pinNumber === null || pagePath === null) {
    return (
      <p className="border-divider text-muted w-[260px] rounded-xl border px-3.5 py-3 text-sm">
        공유한 핀을 찾을 수 없어요.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpen?.(id, pagePath)}
      aria-label={`${pinNumber}번 핀으로 이동`}
      className="border-divider hover:border-ink flex w-[260px] flex-col gap-2 rounded-xl border bg-white px-3.5 py-3 text-left transition-colors"
    >
      <span className="flex items-center gap-2">
        <span className="bg-brand grid size-6 place-items-center rounded-full rounded-bl-[4px] text-xs font-extrabold text-white">
          {pinNumber}
        </span>
        <span className="text-sm font-extrabold">{pinNumber}번 핀</span>
        {status && (
          <span className="ml-auto">
            <RequestStatusBadge label={CHANGE_REQUEST_STATUS_LABEL[status]} status={status} />
          </span>
        )}
      </span>
      <span className="text-text line-clamp-2 text-[13px] leading-relaxed wrap-anywhere">
        {preview ?? '요청 내용이 삭제됐어요.'}
      </span>
    </button>
  );
};

export default SharedPinCard;
