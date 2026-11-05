import { cn } from '@/shared/lib';

import type { PinTone } from '../model/tone';

interface NumberedPinProps {
  number: number;
  /** 저장 전인 새 핀 */
  draft?: boolean;
  /** 차례에 따른 색. 기본은 메인 컬러(내 차례)입니다. */
  tone?: PinTone;
  /** 내가 움직일 차례. 오른쪽 위에 빨간 점을 붙입니다(고른 핀에는 붙이지 않음). */
  alert?: boolean;
  /** 지금 보고 있는 핀. 진한 보라로 채우고 크게 보여 줍니다. */
  selected?: boolean;
  className?: string;
}

const TONE_CLASS: Record<PinTone, string> = {
  brand: 'bg-brand',
  quiet: 'bg-brand-quiet',
  done: 'bg-pin-done',
};

// 왼쪽 아래 뾰족한 모서리가 핀이 가리키는 지점입니다. 색 채우기 + 흰 숫자, 그림자 없음.
// 해결된 핀도 작은 점으로 줄이지 않고 같은 크기로 그립니다.
const NumberedPin = ({
  number,
  draft = false,
  tone = 'brand',
  alert = false,
  selected = false,
  className,
}: NumberedPinProps) => {
  return (
    <span
      className={cn(
        'ease-spring relative grid size-[38px] shrink-0 origin-bottom-left animate-[pin-drop_0.45s_var(--ease-out-soft)_both] place-items-center rounded-[50%_50%_50%_8px] text-[15px] leading-none font-extrabold text-white transition-[scale,background-color] duration-300 group-hover:scale-120',
        draft ? 'bg-ink' : selected ? 'bg-brand-strong scale-120' : TONE_CLASS[tone],
        className,
      )}
    >
      {number}
      {alert && !selected && !draft && (
        <span
          aria-hidden
          className="bg-alert absolute top-px right-px size-2.5 rounded-full border-2 border-white"
        />
      )}
    </span>
  );
};

export default NumberedPin;
