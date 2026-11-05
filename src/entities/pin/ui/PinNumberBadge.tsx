import { cn } from '@/shared/lib';
import { Icon } from '@/shared/ui';

interface PinNumberBadgeProps {
  /** 핀 없는 요청(채팅에서 등록)은 `null`이고 말풍선 아이콘을 넣습니다. */
  number: number | null;
  /** 지금 보고 있는 핀은 채웁니다. 목록처럼 반복되는 곳은 연하게 둡니다. */
  filled?: boolean;
  /** 해결된 요청은 회색 */
  done?: boolean;
  /** `md` 26px(목록·머리글), `lg` 40px(새 요청) */
  size?: 'md' | 'lg';
  className?: string;
}

/** 패널 안의 핀 번호 (demo-design `.pin-no`). 왼쪽 아래 모서리만 각진 원입니다. */
const PinNumberBadge = ({
  number,
  filled = false,
  done = false,
  size = 'md',
  className,
}: PinNumberBadgeProps) => (
  <span
    className={cn(
      'grid shrink-0 place-items-center rounded-[50%_50%_50%_5px] font-extrabold',
      size === 'lg' ? 'size-10 text-base' : 'size-[26px] text-xs',
      done ? 'bg-faint text-white' : filled ? 'bg-brand text-white' : 'bg-brand-soft text-brand',
      className,
    )}
  >
    {number ?? <Icon name="chat" size={size === 'lg' ? 18 : 13} />}
  </span>
);

export default PinNumberBadge;
