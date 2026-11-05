'use client';

import { type FormEvent, type ReactNode, useState } from 'react';

import {
  canTransition,
  type ChangeRequestStatus,
  getTransitionErrorMessage,
} from '@/entities/request';
import { can, type ProjectRole } from '@/entities/user';
import type { ApiError } from '@/shared/api';
import {
  Button,
  type ButtonSize,
  Dialog,
  DialogDescription,
  DialogTitle,
  Textarea,
} from '@/shared/ui';

import { useReopenChangeRequest, useResolveChangeRequest } from '../api/resolve-request';

interface ResolveRequestButtonsProps {
  projectId: number;
  requestId: number;
  status: ChangeRequestStatus;
  role: ProjectRole | null | undefined;
  size?: ButtonSize;
}

type DialogKind = 'resolve' | 'reopen';

interface ConfirmDialogProps {
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
}

/** 열린 채로 마운트되는 확인 모달. Esc와 바깥 클릭으로 닫힙니다. */
const ConfirmDialog = ({ title, description, onClose, children }: ConfirmDialogProps) => (
  <Dialog onClose={onClose} className="w-[400px]">
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-1.5">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </div>
      {children}
    </div>
  </Dialog>
);

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
        <Button
          variant="secondary"
          size={size}
          onClick={() => openDialog('reopen')}
          className="bg-white"
        >
          재수정 요청
        </Button>
      )}
      {canResolve && (
        <Button size={size} onClick={() => openDialog('resolve')}>
          해결 완료
        </Button>
      )}
      {notice && (
        <p role="alert" className="text-warn w-full text-right text-xs font-semibold">
          {notice}
        </p>
      )}

      {dialog === 'resolve' && (
        <ConfirmDialog
          title="이 요청을 해결됨으로 바꿀까요?"
          description="해결된 요청은 기본 화면에서 숨겨지지만 지워지지 않아요. 해결된 핀에는 더 이상 댓글을 남길 수 없어요."
          onClose={() => setDialog(null)}
        >
          {dialogError && (
            <p role="alert" className="text-warn text-xs font-semibold">
              {getTransitionErrorMessage(dialogError)}
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setDialog(null)} className="flex-1">
              취소
            </Button>
            <Button
              autoFocus
              disabled={resolve.isPending}
              onClick={handleResolve}
              className="flex-1"
            >
              {resolve.isPending ? '처리 중…' : '해결 완료'}
            </Button>
          </div>
        </ConfirmDialog>
      )}

      {dialog === 'reopen' && (
        <ConfirmDialog
          title="다시 고쳐 달라고 요청할까요?"
          description="어떤 점이 아직 아쉬운지 적어 주세요. 개발자에게 알림이 가요."
          onClose={() => setDialog(null)}
        >
          <form onSubmit={handleReopen} className="flex flex-col gap-3">
            <Textarea
              autoFocus
              rows={4}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="예: 휴대폰에서 버튼이 여전히 잘려 보여요"
              aria-label="재수정 사유"
              required
              disabled={reopen.isPending}
              className="max-h-60"
            />
            {dialogError && (
              <p role="alert" className="text-warn text-xs font-semibold">
                {getTransitionErrorMessage(dialogError)}
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setDialog(null)} className="flex-1">
                취소
              </Button>
              <Button
                type="submit"
                disabled={!trimmedReason || reopen.isPending}
                className="flex-1"
              >
                {reopen.isPending ? '보내는 중…' : '재수정 요청'}
              </Button>
            </div>
          </form>
        </ConfirmDialog>
      )}
    </div>
  );
};

export default ResolveRequestButtons;
