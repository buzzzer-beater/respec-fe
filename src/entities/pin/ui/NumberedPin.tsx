import type { RequestStatusTone } from '@/entities/request/@x/pin';
import { cn } from '@/shared/lib';

interface NumberedPinProps {
  number: number;
  /** 해결됐거나 요청이 없는 핀. 작은 점으로 줄이고, 부모(group)에 마우스를 올리면 번호를 보여 줍니다. */
  muted?: boolean;
  /** 저장 전인 새 핀 */
  draft?: boolean;
  /** 요청 상태 색. 기본은 메인 컬러입니다. */
  tone?: RequestStatusTone;
  className?: string;
}

const TONE_CLASS: Record<RequestStatusTone, string> = {
  brand: 'bg-brand group-hover:bg-brand-strong',
  ink: 'bg-ink group-hover:bg-text',
  warn: 'bg-warn group-hover:brightness-90',
  faint: 'bg-faint group-hover:bg-muted',
};

// 왼쪽 아래 뾰족한 모서리가 핀이 가리키는 지점입니다. 상태 색 채우기 + 흰 숫자, 그림자 없음.
const NumberedPin = ({
  number,
  muted = false,
  draft = false,
  tone = 'brand',
  className,
}: NumberedPinProps) => {
  return (
    <span
      className={cn(
        'ease-spring grid shrink-0 animate-[pin-drop_0.45s_var(--ease-out-soft)_both] place-items-center rounded-[50%_50%_50%_6px] text-[13px] leading-none font-extrabold text-white transition-[width,height,scale,background-color] duration-300 group-hover:scale-110',
        draft ? 'bg-ink' : TONE_CLASS[tone],
        muted
          ? 'size-3 text-[0px] group-hover:size-7 group-hover:scale-100 group-hover:text-xs'
          : 'size-[30px]',
        className,
      )}
    >
      {number}
    </span>
  );
};

export default NumberedPin;
