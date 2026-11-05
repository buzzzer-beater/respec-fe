import { cn } from '@/shared/lib';

import type { PinTone } from '../model/tone';
import type { PinMarkerKind } from '../model/types';

interface NumberedPinProps {
  number: number;
  /** 마커 종류. 반영 위치는 흰 테두리 + 검정 링, 저장 전 위치는 검정입니다. */
  kind?: PinMarkerKind;
  /** `kind="draft"`와 같습니다. 저장 전인 새 핀 */
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
  kind = 'pin',
  draft = false,
  tone = 'brand',
  alert = false,
  selected = false,
  className,
}: NumberedPinProps) => {
  const isDraft = draft || kind === 'draft';

  return (
    <span
      className={cn(
        'ease-spring relative grid size-[38px] shrink-0 origin-bottom-left animate-[pin-drop_0.45s_var(--ease-out-soft)_both] place-items-center rounded-[50%_50%_50%_8px] text-[15px] leading-none font-extrabold text-white transition-[scale,background-color] duration-300 group-hover:scale-120',
        isDraft ? 'bg-ink' : selected ? 'bg-brand-strong scale-120' : TONE_CLASS[tone],
        // 배포본의 반영 위치는 흰 테두리로 그 사이트에 찍은 핀과 구분합니다.
        kind === 'review' && 'shadow-[0_0_0_2px_#fff,0_0_0_3.5px_var(--color-ink)]',
        className,
      )}
    >
      {number}
      {alert && !selected && !isDraft && (
        <span
          aria-hidden
          className="bg-alert absolute top-px right-px size-2.5 rounded-full border-2 border-white"
        />
      )}
    </span>
  );
};

export default NumberedPin;
