import type { CSSProperties, ReactNode } from 'react';

import { CHANGE_REQUEST_STATUS_TONE, type ChangeRequestStatus } from '@/entities/request/@x/pin';
import { cn } from '@/shared/lib';

import NumberedPin from './NumberedPin';

interface PinMarkerButtonProps {
  number: number;
  /** 연결된 수정 요청 상태. 마커 색을 정합니다. */
  status?: ChangeRequestStatus | null;
  /** 해결됐거나 요청이 없는 핀. 작은 점으로 그립니다(선택하면 원래 크기). */
  muted?: boolean;
  selected?: boolean;
  /** 마우스를 올리면 보여 줄 요청 내용 */
  preview?: string | null;
  onClick?: () => void;
  /** 마커 위치(`left`, `top`). 버튼 왼쪽 아래가 핀이 가리키는 지점입니다. */
  style?: CSSProperties;
  className?: string;
  /** 마커 옆에 붙일 표시(위치 확인 필요 등) */
  children?: ReactNode;
}

/** 사이트 위에 그리는 핀 마커 하나. 배포 사이트와 초안 미리보기가 같이 씁니다. */
const PinMarkerButton = ({
  number,
  status,
  muted = false,
  selected = false,
  preview,
  onClick,
  style,
  className,
  children,
}: PinMarkerButtonProps) => {
  return (
    <button
      type="button"
      aria-label={preview ? `${number}번 핀: ${preview}` : `${number}번 핀`}
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'group absolute -translate-y-full text-left hover:z-20 focus-visible:z-20',
        selected ? 'z-20' : 'z-10',
        className,
      )}
      style={style}
    >
      <NumberedPin
        number={number}
        muted={muted && !selected}
        tone={status ? CHANGE_REQUEST_STATUS_TONE[status] : 'brand'}
        className={cn(selected && 'ring-brand/30 scale-110 ring-4')}
      />
      {preview && (
        <span
          aria-hidden
          className="bg-ink pointer-events-none invisible absolute top-0 left-full ml-2 line-clamp-3 w-max max-w-[240px] rounded-[10px] px-3 py-2 text-[13px] leading-snug font-semibold wrap-anywhere text-white opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100"
        >
          {preview}
        </span>
      )}
      {children}
    </button>
  );
};

export default PinMarkerButton;
