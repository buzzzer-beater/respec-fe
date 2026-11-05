import type { CSSProperties, ReactNode } from 'react';

import { cn } from '@/shared/lib';

import type { PinTone } from '../model/tone';
import NumberedPin from './NumberedPin';

interface PinMarkerButtonProps {
  number: number;
  /** 차례에 따른 색(`getPinLook`) */
  tone?: PinTone;
  /** 내가 움직일 차례라 빨간 점을 붙이는 핀 */
  alert?: boolean;
  selected?: boolean;
  /** `review`면 배포본의 반영 위치로 그립니다(흰 테두리 + 검정 링). */
  kind?: 'pin' | 'review';
  onClick?: () => void;
  /** 마커 위치(`left`, `top`). 버튼 왼쪽 아래가 핀이 가리키는 지점입니다. */
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
}

/**
 * 사이트 위에 그리는 핀 마커 하나. 배포 사이트와 초안 미리보기가 같이 씁니다.
 * 위치가 바뀌면(창 크기, 재배치) 제자리로 미끄러지듯 옮깁니다.
 */
const PinMarkerButton = ({
  number,
  tone,
  alert = false,
  selected = false,
  kind = 'pin',
  onClick,
  style,
  className,
  children,
}: PinMarkerButtonProps) => {
  return (
    <button
      type="button"
      aria-label={`핀 ${number}`}
      title={kind === 'review' ? `핀 ${number} 반영 위치` : undefined}
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'group ease-out-soft absolute -translate-y-full text-left transition-[left,top] duration-250 hover:z-20 focus-visible:z-20',
        selected ? 'z-20' : 'z-10',
        className,
      )}
      style={style}
    >
      <NumberedPin number={number} tone={tone} alert={alert} selected={selected} kind={kind} />
      {children}
    </button>
  );
};

export default PinMarkerButton;
