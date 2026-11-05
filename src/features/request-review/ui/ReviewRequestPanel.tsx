'use client';

import { useRef, useState } from 'react';

import { PIN_SOURCE_LABEL, PinNumberBadge, type PinPosition, toPageLabel } from '@/entities/pin';
import { isApiError } from '@/shared/api';
import { cn } from '@/shared/lib';
import { Button, Icon, toast } from '@/shared/ui';

import { usePostReviewRequest } from '../api/review-request';
import {
  describeReviewLocation,
  getReviewItemError,
  getReviewPositionTone,
  type ReviewCandidate,
  type ReviewPositionTone,
  toReviewRequestItems,
} from '../model/review-draft';

interface ReviewRequestPanelProps {
  projectId: number;
  /** 작업 중(`in_progress`)인 요청만 넘깁니다. polling으로 빠지면 목록에서도 빠집니다. */
  candidates: ReviewCandidate[];
  /** 처음부터 골라 둘 요청("검수 요청에 담기"로 열었을 때) */
  initialSelectedIds?: number[];
  /** 검수할 배포 주소의 호스트. 연결 전이면 `null`이고 보낼 수 없습니다(백엔드 409). */
  deploymentHost: string | null;
  /** "변경"/"연결": 배포 연결 대화상자를 엽니다. */
  onChangeDeployment?: () => void;
  /** 요청 id → 배포본에 찍은 반영 위치. 사이트에서 누르는 일은 뷰어가 해서 부모가 들고 있습니다. */
  locations: Partial<Record<number, PinPosition>>;
  /** 지금 사이트에서 반영 위치를 누르는 중인 요청 */
  placingRequestId: number | null;
  /** 반영 위치 누르기 시작(요청 id) 또는 취소(`null`). 부모가 뷰어를 핀 모드로 바꿉니다. */
  onStartPlacing: (requestId: number | null) => void;
  onClose: () => void;
  /** 보낸 뒤. 안내와 닫기(`onClose`)는 여기서 합니다. */
  onSubmitted?: (requestIds: number[]) => void;
}

const getSubmitErrorMessage = (error: unknown) => {
  if (isApiError(error, 'CONFLICT'))
    return '작업 중이 아닌 요청이 섞여 있거나 배포 주소가 없어요. 목록을 확인하고 다시 시도해 주세요.';
  if (isApiError(error, 'FORBIDDEN')) return '개발자만 검수를 요청할 수 있어요.';
  if (isApiError(error, 'VALIDATION_ERROR')) return '보낼 요청을 다시 확인해 주세요.';
  return '검수 요청을 보내지 못했어요. 잠시 후 다시 시도해 주세요.';
};

const POSITION_CLASS: Record<Exclude<ReviewPositionTone, 'set'>, string> = {
  primary: 'bg-brand text-white shadow-[0_6px_16px_rgba(86,71,224,0.28)] hover:-translate-y-px',
  next: 'text-brand bg-white shadow-[inset_0_0_0_1.5px_#c9c4f5] hover:-translate-y-px',
  placing:
    'text-brand animate-[pulse-line_1.2s_ease-in-out_infinite] bg-white shadow-[inset_0_0_0_2px_var(--color-brand)]',
};

/**
 * 오른쪽 패널의 검수 요청 만들기 (demo-design `renderReview`). 개발자만 씁니다.
 * 작업 중인 요청을 골라 요청마다 반영 설명을 쓰고, 배포본에서 고친 곳을 찍어 한 번에 보냅니다.
 * 빠진 내용이 있으면 그 카드로 스크롤하고 몇 건인지 알려 줍니다.
 */
const ReviewRequestPanel = ({
  projectId,
  candidates,
  initialSelectedIds = [],
  deploymentHost,
  onChangeDeployment,
  locations,
  placingRequestId,
  onStartPlacing,
  onClose,
  onSubmitted,
}: ReviewRequestPanelProps) => {
  const [selected, setSelected] = useState<Set<number>>(() => new Set(initialSelectedIds));
  const [notes, setNotes] = useState<Partial<Record<number, string>>>({});
  // 한 번 보내 본 뒤에는 빠진 내용을 카드마다 바로바로 알려 줍니다.
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);
  const { mutate, isPending } = usePostReviewRequest(projectId);

  const picked = candidates.filter((candidate) => selected.has(candidate.requestId));
  const draftOf = (id: number) => ({ note: notes[id] ?? '', location: locations[id] });
  const errorOf = (id: number) => (checkedIds.has(id) ? getReviewItemError(draftOf(id)) : null);
  const firstMissingId = picked.find(({ requestId }) => !locations[requestId])?.requestId ?? null;

  const toggle = (id: number) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    if (placingRequestId === id) onStartPlacing(null);
  };

  const close = () => {
    if (placingRequestId !== null) onStartPlacing(null);
    onClose();
  };

  const submit = () => {
    if (picked.length === 0) {
      toast('보낼 요청을 골라 주세요');
      return;
    }
    if (isPending) return;
    const ids = picked.map(({ requestId }) => requestId);
    const missing = ids.filter((id) => getReviewItemError(draftOf(id)) !== null);
    if (missing.length > 0) {
      setCheckedIds(new Set(ids));
      requestAnimationFrame(() =>
        listRef.current
          ?.querySelector('[data-error="true"]')
          ?.scrollIntoView({ block: 'center', behavior: 'smooth' }),
      );
      toast(`${missing.length}건에 빠진 내용이 있어요`);
      return;
    }
    if (placingRequestId !== null) onStartPlacing(null);
    mutate(
      { items: toReviewRequestItems(ids, Object.fromEntries(ids.map((id) => [id, draftOf(id)]))) },
      {
        onSuccess: () => {
          toast(`${ids.length}건 검수 요청을 보냈어요`);
          onSubmitted?.(ids);
          onClose();
        },
        onError: (error) => toast(getSubmitErrorMessage(error)),
      },
    );
  };

  return (
    <div className="bg-stage flex min-h-full animate-[slide-in_0.3s_var(--ease-out-soft)] flex-col">
      <header className="border-divider sticky top-0 z-[2] flex h-[76px] shrink-0 items-center gap-2.5 border-b bg-white pr-9 pl-6">
        <button
          type="button"
          onClick={close}
          aria-label="검수 요청 닫기"
          className="text-muted hover:bg-hover hover:text-ink grid size-[34px] place-items-center rounded-[10px] transition-colors"
        >
          <Icon name="left" size={18} />
        </button>
        <h2 className="text-xl font-extrabold">검수 요청</h2>
        <span className="bg-hover text-text rounded-full px-2.5 py-1 text-[13px] font-bold">
          작업 중 {candidates.length}
        </span>
      </header>

      <div className="text-muted mx-6 mt-5 flex items-center gap-2.5 rounded-[14px] bg-white px-4 py-3.5 text-sm shadow-[0_0_0_1px_var(--color-divider)]">
        <Icon name="link" size={15} />
        <span className="shrink-0">검수할 사이트</span>
        <b className="text-ink min-w-0 truncate">{deploymentHost ?? '연결 전'}</b>
        {onChangeDeployment && (
          <button
            type="button"
            onClick={onChangeDeployment}
            className="text-text ml-auto shrink-0 text-[13px] font-bold underline underline-offset-[3px]"
          >
            {deploymentHost ? '변경' : '연결'}
          </button>
        )}
      </div>
      {!deploymentHost && (
        <p className="bg-warn-soft text-warn-strong mx-6 mt-3 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold">
          검수 요청을 보내려면 먼저 배포 주소를 연결해 주세요.
        </p>
      )}

      {candidates.length === 0 ? (
        <div className="mx-6 my-3.5 grid gap-1.5 rounded-[14px] bg-white px-5 py-7 text-center shadow-[0_0_0_1px_var(--color-divider)]">
          <b>작업 중인 요청이 없어요</b>
          <span className="text-muted text-[13px]">
            요청을 열어 &quot;작업 시작&quot;을 누르면 여기서 고를 수 있어요.
          </span>
        </div>
      ) : (
        <div ref={listRef} className="grid gap-3 px-6 pt-4 pb-7">
          {candidates.map((candidate) => {
            const { requestId, pinNumber, text, source, pagePath } = candidate;
            const isChecked = selected.has(requestId);
            const error = isChecked ? errorOf(requestId) : null;
            const location = locations[requestId];
            const tone = getReviewPositionTone(requestId, {
              hasLocation: !!location,
              firstMissingId,
              placingId: placingRequestId,
            });
            const isPlacing = placingRequestId === requestId;
            const label = pinNumber === null ? '요청' : `핀 ${pinNumber}`;

            return (
              <div
                key={requestId}
                data-error={!!error}
                className={cn(
                  'rounded-2xl bg-white transition-shadow',
                  error
                    ? 'shadow-[0_0_0_1.5px_var(--color-error-line)]'
                    : isChecked
                      ? 'shadow-[0_0_0_1.5px_var(--color-ink),0_8px_24px_rgba(24,24,27,0.06)]'
                      : 'shadow-[0_0_0_1px_var(--color-divider)]',
                )}
              >
                <label className="flex cursor-pointer items-start gap-3.5 px-5 pt-5 pb-[18px]">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggle(requestId)}
                    disabled={isPending}
                    className="accent-ink mt-1 size-5 shrink-0"
                  />
                  <PinNumberBadge number={pinNumber} />
                  <span className="grid min-w-0 gap-1.5">
                    <b className="line-clamp-2 text-base leading-[1.55] font-bold wrap-anywhere">
                      {text}
                    </b>
                    <small className="text-muted text-[13px] font-medium">
                      {source && pagePath
                        ? `${PIN_SOURCE_LABEL[source]} ${toPageLabel(pagePath)}`
                        : '채팅에서 등록'}
                    </small>
                  </span>
                </label>

                {isChecked && (
                  <div className="grid gap-3 pr-5 pb-5 pl-[54px]">
                    <textarea
                      rows={2}
                      value={notes[requestId] ?? ''}
                      onChange={(event) =>
                        setNotes((prev) => ({ ...prev, [requestId]: event.target.value }))
                      }
                      placeholder="무엇을 어떻게 고쳤는지 적어 주세요"
                      aria-label={`${label} 반영 설명`}
                      disabled={isPending}
                      className="border-field focus:border-ink text-ink placeholder:text-faint min-h-[88px] w-full resize-y rounded-xl border px-3.5 py-3 text-[15px] leading-[1.6] outline-none"
                    />
                    {tone === 'set' && location ? (
                      <div className="bg-ai text-ink flex h-[46px] w-full items-center gap-2 rounded-xl px-4 text-[15px] font-semibold">
                        <Icon name="pin" size={15} className="text-ok" />
                        <span className="min-w-0 truncate">{describeReviewLocation(location)}</span>
                        <button
                          type="button"
                          onClick={() => onStartPlacing(requestId)}
                          className="text-text ml-auto shrink-0 text-[13px] font-bold underline underline-offset-[3px]"
                        >
                          {isPlacing ? '누르는 중…' : '다시 찍기'}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        aria-pressed={isPlacing}
                        onClick={() => onStartPlacing(isPlacing ? null : requestId)}
                        className={cn(
                          'ease-spring flex h-[50px] w-full items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-bold transition-[transform,box-shadow] duration-300',
                          POSITION_CLASS[tone === 'set' ? 'primary' : tone],
                        )}
                      >
                        <Icon name="pin" size={15} />
                        {isPlacing
                          ? '배포본에서 고친 곳을 눌러 주세요 · 다시 누르면 취소'
                          : '배포본에서 반영 위치 찍기'}
                      </button>
                    )}
                    {error && <p className="text-warn text-sm font-semibold">{error}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <footer className="border-divider sticky bottom-0 mt-auto flex gap-2 border-t bg-white px-6 pt-4 pb-6">
        <Button variant="secondary" size="lg" onClick={close} disabled={isPending}>
          취소
        </Button>
        <Button
          size="lg"
          onClick={submit}
          disabled={isPending || picked.length === 0 || !deploymentHost}
          className="disabled:bg-divider disabled:text-faint flex-1 disabled:opacity-100"
        >
          {isPending
            ? '보내는 중…'
            : picked.length > 0
              ? `${picked.length}건 검수 요청 보내기`
              : '보낼 요청을 골라 주세요'}
        </Button>
      </footer>
    </div>
  );
};

export default ReviewRequestPanel;
