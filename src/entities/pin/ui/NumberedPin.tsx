import Image from 'next/image';

import { cn } from '@/shared/lib';

import badgeIcon from '../assets/badge.svg';

interface NumberedPinProps {
  number: number;
  muted?: boolean;
  showBadge?: boolean;
  className?: string;
}

// 왼쪽 아래 뾰족한 모서리가 핀이 가리키는 지점입니다.
const NumberedPin = ({ number, muted = false, showBadge = false, className }: NumberedPinProps) => {
  return (
    <span
      className={cn(
        'relative flex size-12 shrink-0 items-center justify-center rounded-full rounded-bl-none text-lg leading-[normal] font-semibold text-white',
        muted ? 'bg-primary-muted' : 'bg-primary',
        className,
      )}
    >
      {number}
      {showBadge && (
        <Image src={badgeIcon} alt="" unoptimized className="absolute top-[1.5px] left-[34.5px]" />
      )}
    </span>
  );
};

export default NumberedPin;
