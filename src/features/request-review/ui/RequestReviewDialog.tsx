'use client';

import { type FormEvent, useState } from 'react';

import type { ChangeRequest } from '@/entities/request';
import { isApiError } from '@/shared/api';
import { Button, Dialog, DialogDescription, DialogTitle, Input, Textarea } from '@/shared/ui';

import { usePostReviewRequest } from '../api/review-request';
import {
  type ReviewNotes,
  type ReviewRequestFormErrors,
  validateReviewRequestForm,
} from '../model/form';

interface RequestReviewDialogProps {
  projectId: number;
  /** `in_progress` 요청만 넘깁니다. */
  candidates: ChangeRequest[];
  /** 처음부터 골라 둘 요청 id("검수 요청에 담기"로 열었을 때) */
  initialSelectedIds?: number[];
  defaultDeploymentUrl: string;
  onClose: () => void;
}

const getSubmitErrorMessage = (error: unknown) => {
  if (isApiError(error, 'CONFLICT'))
    return '진행 중이 아닌 요청이 섞여 있습니다. 목록을 확인하고 다시 시도해 주세요.';
  if (isApiError(error, 'FORBIDDEN')) return '개발자만 검수를 요청할 수 있습니다.';
  if (isApiError(error, 'VALIDATION_ERROR')) return '입력한 내용을 다시 확인해 주세요.';
  return '검수 요청을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.';
};

const RequestReviewDialog = ({
  projectId,
  candidates,
  initialSelectedIds = [],
  defaultDeploymentUrl,
  onClose,
}: RequestReviewDialogProps) => {
  const [notes, setNotes] = useState<ReviewNotes>(
    () =>
      new Map(
        initialSelectedIds
          .filter((id) => candidates.some((candidate) => candidate.id === id))
          .map((id) => [id, '']),
      ),
  );
  const [deploymentUrl, setDeploymentUrl] = useState(defaultDeploymentUrl);
  const [errors, setErrors] = useState<ReviewRequestFormErrors | null>(null);
  const { mutate, isPending, error } = usePostReviewRequest(projectId);

  const toggle = (id: number) => {
    setNotes((prev) => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else next.set(id, '');
      return next;
    });
  };

  const changeNote = (id: number, note: string) => {
    setNotes((prev) => new Map(prev).set(id, note));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) return;

    // polling 중에 진행 중에서 빠진 요청은 제외합니다.
    const selected: ReviewNotes = new Map(
      [...notes].filter(([id]) => candidates.some((candidate) => candidate.id === id)),
    );
    const nextErrors = validateReviewRequestForm(deploymentUrl, selected);
    setErrors(nextErrors);
    if (nextErrors) return;

    mutate(
      {
        deployment_url: deploymentUrl.trim(),
        items: [...selected].map(([id, note]) => ({
          change_request_id: id,
          implementation_note: note.trim(),
        })),
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog onClose={onClose} closeOnBackdropClick={false} className="max-h-[85vh] w-[560px]">
      <form onSubmit={handleSubmit} noValidate className="flex max-h-[85vh] flex-col">
        <div className="px-6 pt-6 pb-4">
          <DialogTitle>검수 요청</DialogTitle>
          <DialogDescription className="mt-1 text-sm">
            반영한 요청을 고르고 무엇을 바꿨는지 적어 주세요. 고객이 확인하고 해결 처리합니다.
          </DialogDescription>
        </div>

        {candidates.length === 0 ? (
          <p className="bg-stage text-text mx-6 rounded-xl px-4 py-6 text-center text-sm">
            진행 중인 요청이 없습니다. 요청을 진행 중으로 바꾼 뒤 검수를 요청할 수 있습니다.
          </p>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 pb-2">
            <fieldset className="flex flex-col gap-2.5">
              <legend className="mb-2 text-sm font-bold">
                진행 중인 요청 <span className="text-muted">{notes.size}개 선택</span>
              </legend>
              {candidates.map((candidate) => {
                const checked = notes.has(candidate.id);
                const noteId = `review-note-${candidate.id}`;
                const isEmpty = errors?.emptyNoteIds.includes(candidate.id) ?? false;
                return (
                  <div key={candidate.id} className="border-divider rounded-xl border p-4">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(candidate.id)}
                        disabled={isPending}
                        className="accent-ink mt-0.5 size-4 shrink-0"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="text-muted block text-xs">요청 #{candidate.id}</span>
                        <span className="mt-1 line-clamp-2 block text-[15px] font-semibold">
                          {candidate.ai_summary ?? '요약 없음'}
                        </span>
                      </span>
                    </label>
                    {checked && (
                      <div className="mt-3 flex flex-col gap-1.5 pl-7">
                        <label htmlFor={noteId} className="text-text text-xs font-bold">
                          반영 설명
                        </label>
                        <Textarea
                          id={noteId}
                          rows={2}
                          value={notes.get(candidate.id) ?? ''}
                          onChange={(event) => changeNote(candidate.id, event.target.value)}
                          placeholder="예: 모바일에서 버튼이 화면 밖으로 나가지 않게 너비를 줄였습니다."
                          aria-invalid={isEmpty || undefined}
                          disabled={isPending}
                          className="field-sizing-content max-h-40 py-2.5 text-sm"
                        />
                        {isEmpty && (
                          <p className="text-warn text-xs font-semibold">
                            반영 설명을 입력해 주세요.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {errors?.items && <p className="text-warn text-xs font-semibold">{errors.items}</p>}
            </fieldset>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="review-deployment-url" className="text-sm font-bold">
                검수할 배포 URL
              </label>
              <Input
                id="review-deployment-url"
                type="url"
                inputMode="url"
                value={deploymentUrl}
                onChange={(event) => setDeploymentUrl(event.target.value)}
                placeholder="https://"
                aria-invalid={errors?.deploymentUrl ? true : undefined}
                disabled={isPending}
                className="h-auto py-2.5 text-sm"
              />
              {errors?.deploymentUrl && (
                <p className="text-warn text-xs font-semibold">{errors.deploymentUrl}</p>
              )}
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="text-warn px-6 pt-3 text-xs font-semibold">
            {getSubmitErrorMessage(error)}
          </p>
        )}

        <div className="flex gap-2 px-6 pt-4 pb-6">
          <Button variant="secondary" onClick={onClose} className="h-11 flex-1">
            {candidates.length === 0 ? '닫기' : '취소'}
          </Button>
          {candidates.length > 0 && (
            <Button type="submit" disabled={isPending} className="h-11 flex-1">
              {isPending
                ? '보내는 중…'
                : `검수 요청 보내기${notes.size > 0 ? ` (${notes.size})` : ''}`}
            </Button>
          )}
        </div>
      </form>
    </Dialog>
  );
};

export default RequestReviewDialog;
