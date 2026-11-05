'use client';

import { type FormEvent, useState } from 'react';

import type { ChangeRequest } from '@/entities/request';
import { isApiError } from '@/shared/api';

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

const fieldClassName =
  'border-field text-ink placeholder:text-faint focus:border-ink aria-invalid:border-warn w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none';

const RequestReviewDialog = ({
  projectId,
  candidates,
  defaultDeploymentUrl,
  onClose,
}: RequestReviewDialogProps) => {
  const [notes, setNotes] = useState<ReviewNotes>(() => new Map());
  const [deploymentUrl, setDeploymentUrl] = useState(defaultDeploymentUrl);
  const [errors, setErrors] = useState<ReviewRequestFormErrors | null>(null);
  const { mutate, isPending, error } = usePostReviewRequest(projectId);

  // 마운트되면 모달로 엽니다. Esc로 닫으면 `close` 이벤트가 옵니다.
  const openModal = (node: HTMLDialogElement | null) => {
    if (node && !node.open) node.showModal();
  };

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
    <dialog
      ref={openModal}
      onClose={onClose}
      aria-labelledby="request-review-title"
      className="backdrop:bg-ink/40 m-auto max-h-[85vh] w-[min(560px,calc(100vw-32px))] rounded-2xl bg-white p-0 shadow-[0_12px_32px_rgba(24,24,27,0.14)]"
    >
      <form onSubmit={handleSubmit} noValidate className="flex max-h-[85vh] flex-col">
        <div className="px-6 pt-6 pb-4">
          <h2 id="request-review-title" className="text-lg font-extrabold">
            검수 요청
          </h2>
          <p className="text-muted mt-1 text-sm">
            반영한 요청을 고르고 무엇을 바꿨는지 적어 주세요. 고객이 확인하고 해결 처리합니다.
          </p>
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
                        <textarea
                          id={noteId}
                          rows={2}
                          value={notes.get(candidate.id) ?? ''}
                          onChange={(event) => changeNote(candidate.id, event.target.value)}
                          placeholder="예: 모바일에서 버튼이 화면 밖으로 나가지 않게 너비를 줄였습니다."
                          aria-invalid={isEmpty || undefined}
                          disabled={isPending}
                          className={`${fieldClassName} field-sizing-content max-h-40 resize-none`}
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
              <input
                id="review-deployment-url"
                type="url"
                inputMode="url"
                value={deploymentUrl}
                onChange={(event) => setDeploymentUrl(event.target.value)}
                placeholder="https://"
                aria-invalid={errors?.deploymentUrl ? true : undefined}
                disabled={isPending}
                className={fieldClassName}
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

        <div className="flex gap-2 px-6 pt-4 pb-6 text-sm font-semibold">
          <button
            type="button"
            onClick={onClose}
            className="border-divider text-ink hover:bg-hover h-11 flex-1 rounded-xl border"
          >
            {candidates.length === 0 ? '닫기' : '취소'}
          </button>
          {candidates.length > 0 && (
            <button
              type="submit"
              disabled={isPending}
              className="bg-ink h-11 flex-1 rounded-xl text-white transition-transform active:scale-95 disabled:opacity-40"
            >
              {isPending
                ? '보내는 중…'
                : `검수 요청 보내기${notes.size > 0 ? ` (${notes.size})` : ''}`}
            </button>
          )}
        </div>
      </form>
    </dialog>
  );
};

export default RequestReviewDialog;
