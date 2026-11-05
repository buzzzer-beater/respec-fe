'use client';

import type { PinPosition } from '@/entities/pin';
import type { ReviewItem } from '@/entities/review';
import { describeReviewLocation } from '@/features/request-review';
import { AiPlainText, Icon, toast } from '@/shared/ui';

interface ReviewNoteSectionProps {
  item: ReviewItem;
  /** 검수 요청을 보낸 개발자(이메일)와 시간. 상태 이력에서 찾습니다. */
  authorName: string | null;
  timeLabel: string;
  hasDeployment: boolean;
  /** 이미 배포본의 그 페이지를 보고 있으면 "반영 위치 보기"를 숨깁니다. */
  isViewingLocation: boolean;
  onShowLocation?: (location: PinPosition) => void;
}

/**
 * 요청 상세의 "반영 내용" (demo-design `renderReviewNote`). 왼쪽에 검정 띠를 둡니다.
 * 개발자가 검수 요청 때 쓴 반영 설명 원문을 보여 주고, AI 쉬운 풀이는 접어 둡니다.
 */
const ReviewNoteSection = ({
  item,
  authorName,
  timeLabel,
  hasDeployment,
  isViewingLocation,
  onShowLocation,
}: ReviewNoteSectionProps) => {
  const { location, implementation_note: note } = item;
  const meta = [authorName, timeLabel, location && describeReviewLocation(location)]
    .filter(Boolean)
    .join(' · ');

  return (
    <section className="bg-white px-9 py-8 shadow-[inset_3px_0_0_var(--color-ink)]">
      <h3 className="text-ink mb-3.5 text-base font-extrabold">반영 내용</h3>
      {note && (
        <p className="text-ink text-[17px] leading-[1.65] wrap-anywhere whitespace-pre-wrap">
          {note}
        </p>
      )}
      {meta && <p className="text-muted mt-2 text-[13px]">{meta}</p>}
      <AiPlainText
        plainText={item.ai_plain_text}
        status={item.ai_status}
        label="쉬운 풀이"
        pendingLabel="쉬운 풀이를 만드는 중…"
        className="mt-2"
      />
      {location && !isViewingLocation && (
        <button
          type="button"
          onClick={() =>
            hasDeployment ? onShowLocation?.(location) : toast('아직 배포 주소가 연결되지 않았어요')
          }
          className="text-ink mt-3 flex items-center gap-1.5 text-[13px] font-bold underline underline-offset-[3px]"
        >
          <Icon name="pin" size={15} />
          {hasDeployment
            ? '배포본에서 반영 위치 보기'
            : '배포 주소가 연결되면 반영 위치를 볼 수 있어요'}
        </button>
      )}
    </section>
  );
};

export default ReviewNoteSection;
