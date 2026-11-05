'use client';

import { type FormEvent, useState } from 'react';

import type { ChangeRequest } from '@/entities/request';
import { isApiError } from '@/shared/api';
import { cn } from '@/shared/lib';
import {
  Button,
  Dialog,
  DialogBanner,
  DialogContent,
  DialogFooter,
  DialogTitle,
  toast,
} from '@/shared/ui';

import { usePostReviewRequest } from '../api/review-request';

interface RequestReviewDialogProps {
  projectId: number;
  /** `in_progress` 요청만 넘깁니다. */
  candidates: ChangeRequest[];
  /** 처음부터 골라 둘 요청 id("검수 요청에 담기"로 열었을 때) */
  initialSelectedIds?: number[];
  /** 프로젝트에 연결한 배포 주소. 없으면 보낼 수 없습니다(백엔드 409). */
  hasDeployment: boolean;
  onClose: () => void;
}

const getSubmitErrorMessage = (error: unknown) => {
  if (isApiError(error, 'CONFLICT'))
    return '작업 중이 아닌 요청이 섞여 있거나 배포 주소가 없어요. 목록을 확인하고 다시 시도해 주세요.';
  if (isApiError(error, 'FORBIDDEN')) return '개발자만 검수를 요청할 수 있어요.';
  if (isApiError(error, 'VALIDATION_ERROR')) return '보낼 요청을 다시 확인해 주세요.';
  return '검수 요청을 보내지 못했어요. 잠시 후 다시 시도해 주세요.';
};

/**
 * 작업 중인 요청을 골라 한 번에 검수 요청으로 보냅니다. 검수할 사이트는 처음 연결한 배포 주소로 고정입니다.
 * 임시 화면입니다. 배포본에 반영 위치를 찍는 검수 요청 화면은 작업 화면 패널에 들어갑니다.
 * 요청마다 반영 설명을 쓰는 칸은 백엔드에 필드가 없어 보류했습니다(respec-be#31).
 */
const RequestReviewDialog = ({
  projectId,
  candidates,
  initialSelectedIds = [],
  hasDeployment,
  onClose,
}: RequestReviewDialogProps) => {
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(initialSelectedIds.filter((id) => candidates.some((c) => c.id === id))),
  );
  const { mutate, isPending, error } = usePostReviewRequest(projectId);
  // polling 중에 작업 중에서 빠진 요청은 제외합니다.
  const picked = candidates.filter((candidate) => selected.has(candidate.id));

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending || picked.length === 0 || !hasDeployment) return;
    mutate(
      { items: picked.map(({ id }) => ({ change_request_id: id })) },
      {
        onSuccess: () => {
          toast(`${picked.length}건 검수 요청을 보냈어요`);
          onClose();
        },
      },
    );
  };

  return (
    <Dialog onClose={onClose} preventClose={isPending} className="max-h-[85vh] w-[560px]">
      <form onSubmit={handleSubmit} noValidate className="flex max-h-[85vh] flex-col">
        <DialogContent className="min-h-0 flex-1 overflow-y-auto pb-4">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-xl">검수 요청</DialogTitle>
            <span className="bg-hover text-text rounded-full px-2.5 py-0.5 text-[13px] font-bold">
              작업 중 {candidates.length}
            </span>
          </div>

          {!hasDeployment && (
            <DialogBanner>검수 요청을 보내려면 먼저 배포 주소를 연결해 주세요.</DialogBanner>
          )}

          {candidates.length === 0 ? (
            <div className="bg-stage grid gap-1 rounded-2xl px-5 py-8 text-center">
              <b className="text-sm">작업 중인 요청이 없어요</b>
              <span className="text-muted text-[13px]">
                요청을 열어 &quot;작업 시작&quot;을 누르면 여기서 고를 수 있어요.
              </span>
            </div>
          ) : (
            <ul className="bg-stage -mx-2 grid gap-3 rounded-2xl p-3">
              {candidates.map((candidate) => {
                const checked = selected.has(candidate.id);
                return (
                  <li key={candidate.id}>
                    <label
                      className={cn(
                        'flex cursor-pointer items-start gap-3.5 rounded-2xl bg-white p-5 transition-shadow',
                        checked
                          ? 'shadow-[0_0_0_1.5px_var(--color-ink),0_8px_24px_rgba(24,24,27,0.06)]'
                          : 'shadow-[0_0_0_1px_var(--color-divider)]',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(candidate.id)}
                        disabled={isPending}
                        className="accent-ink mt-0.5 size-5 shrink-0"
                      />
                      <span className="line-clamp-2 min-w-0 text-base font-bold">
                        {candidate.ai_summary?.split('\n')[0] ?? `요청 #${candidate.id}`}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}

          {error && (
            <p role="alert" className="text-warn text-[13px] font-semibold">
              {getSubmitErrorMessage(error)}
            </p>
          )}
        </DialogContent>

        <DialogFooter className="px-8 pt-4 pb-6">
          <Button variant="secondary" size="lg" onClick={onClose} disabled={isPending}>
            취소
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={isPending || picked.length === 0 || !hasDeployment}
            className="disabled:bg-divider disabled:text-faint flex-1 disabled:opacity-100"
          >
            {isPending
              ? '보내는 중…'
              : picked.length > 0
                ? `${picked.length}건 검수 요청 보내기`
                : '보낼 요청을 골라 주세요'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
};

export default RequestReviewDialog;
