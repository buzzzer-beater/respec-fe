'use client';

import { type FormEvent, useState } from 'react';

import {
  canTransition,
  type ChangeRequestStatus,
  getTransitionErrorMessage,
} from '@/entities/request';
import { can, type ProjectRole } from '@/entities/user';
import type { ApiError } from '@/shared/api';
import { cn } from '@/shared/lib';

import { useReopenChangeRequest, useResolveChangeRequest } from '../api/resolve-request';
import ModalDialog from './ModalDialog';

interface ResolveRequestButtonsProps {
  projectId: number;
  requestId: number;
  status: ChangeRequestStatus;
  role: ProjectRole | null | undefined;
  size?: 'sm' | 'md';
}

type DialogKind = 'resolve' | 'reopen';

const buttonSize = {
  sm: 'h-7 rounded-lg px-2.5 text-xs',
  md: 'h-10 rounded-xl px-4 text-sm',
};

/** 고객용 Resolve/재수정 요청 버튼. 검수 대기일 때만 보여 줍니다. */
const ResolveRequestButtons = ({
  projectId,
  requestId,
  status,
  role,
  size = 'md',
}: ResolveRequestButtonsProps) => {
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const resolve = useResolveChangeRequest(projectId);
  const reopen = useReopenChangeRequest(projectId);
  const trimmedReason = reason.trim();

  const canResolve = can(role, 'resolve-request') && canTransition(status, 'resolve');
  const canReopen = can(role, 'reopen-request') && canTransition(status, 'reopen');

  if (!canResolve && !canReopen && !notice) return null;

  const openDialog = (kind: DialogKind) => {
    resolve.reset();
    reopen.reset();
    setNotice(null);
    setReason('');
    setDialog(kind);
  };

  // 409면 다이얼로그를 닫고, 최신 상태를 다시 불러온 뒤 버튼 옆에 안내합니다.
  const handleError = (error: ApiError) => {
    if (error.code !== 'CONFLICT') return;
    setDialog(null);
    setNotice(getTransitionErrorMessage(error));
  };

  const handleResolve = () => {
    resolve.mutate(requestId, { onSuccess: () => setDialog(null), onError: handleError });
  };

  const handleReopen = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedReason || reopen.isPending) return;
    reopen.mutate(
      { requestId, reason: trimmedReason },
      { onSuccess: () => setDialog(null), onError: handleError },
    );
  };

  const dialogError =
    dialog === 'resolve' ? resolve.error : dialog === 'reopen' ? reopen.error : null;

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {canReopen && (
        <button
          type="button"
          onClick={() => openDialog('reopen')}
          className={cn(
            'border-divider text-ink hover:bg-hover border bg-white font-semibold',
            buttonSize[size],
          )}
        >
          재수정 요청
        </button>
      )}
      {canResolve && (
        <button
          type="button"
          onClick={() => openDialog('resolve')}
          className={cn(
            'bg-ink font-semibold text-white transition-transform active:scale-95',
            buttonSize[size],
          )}
        >
          해결 완료
        </button>
      )}
      {notice && (
        <p role="alert" className="text-warn w-full text-right text-xs font-semibold">
          {notice}
        </p>
      )}

      {dialog === 'resolve' && (
        <ModalDialog
          title="이 요청을 해결됨으로 바꿀까요?"
          description="해결된 요청은 기본 화면에서 숨겨지지만 지워지지 않아요. 해결된 핀에는 더 이상 댓글을 남길 수 없어요."
          onClose={() => setDialog(null)}
        >
          {dialogError && (
            <p role="alert" className="text-warn text-xs font-semibold">
              {getTransitionErrorMessage(dialogError)}
            </p>
          )}
          <div className="flex gap-2 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setDialog(null)}
              className="border-divider text-ink hover:bg-hover h-10 flex-1 rounded-xl border"
            >
              취소
            </button>
            <button
              type="button"
              autoFocus
              disabled={resolve.isPending}
              onClick={handleResolve}
              className="bg-ink h-10 flex-1 rounded-xl text-white transition-transform active:scale-95 disabled:opacity-40"
            >
              {resolve.isPending ? '처리 중…' : '해결 완료'}
            </button>
          </div>
        </ModalDialog>
      )}

      {dialog === 'reopen' && (
        <ModalDialog
          title="다시 고쳐 달라고 요청할까요?"
          description="어떤 점이 아직 아쉬운지 적어 주세요. 개발자에게 알림이 가요."
          onClose={() => setDialog(null)}
        >
          <form onSubmit={handleReopen} className="flex flex-col gap-3">
            <textarea
              autoFocus
              rows={4}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="예: 휴대폰에서 버튼이 여전히 잘려 보여요"
              aria-label="재수정 사유"
              required
              disabled={reopen.isPending}
              className="border-field text-ink placeholder:text-faint focus:border-ink max-h-60 w-full resize-none rounded-xl border px-3.5 py-3 text-[15px] leading-normal outline-none"
            />
            {dialogError && (
              <p role="alert" className="text-warn text-xs font-semibold">
                {getTransitionErrorMessage(dialogError)}
              </p>
            )}
            <div className="flex gap-2 text-sm font-semibold">
              <button
                type="button"
                onClick={() => setDialog(null)}
                className="border-divider text-ink hover:bg-hover h-10 flex-1 rounded-xl border"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={!trimmedReason || reopen.isPending}
                className="bg-ink h-10 flex-1 rounded-xl text-white transition-transform active:scale-95 disabled:opacity-40"
              >
                {reopen.isPending ? '보내는 중…' : '재수정 요청'}
              </button>
            </div>
          </form>
        </ModalDialog>
      )}
    </div>
  );
};

export default ResolveRequestButtons;
