'use client';

import { useRef, useState } from 'react';

import type { ApiError } from '@/shared/api';
import { cn } from '@/shared/lib';
import {
  Button,
  buttonClassName,
  CopyButton,
  Dialog,
  DialogClose,
  DialogDescription,
  DialogTitle,
} from '@/shared/ui';

import { useDeleteInvitation, usePostInvitation } from '../api/invitation';
import { toInviteLink } from '../model/invite-link';

const toMessage = (error: ApiError) => {
  if (error.status === 403) return '초대 링크는 프로젝트 고객만 만들거나 비활성화할 수 있어요.';
  return error.message;
};

const formatExpiresAt = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' });
};

interface InviteDeveloperButtonProps {
  projectId: number;
  /** 버튼 문구. 상단바는 "초대", 프로젝트 카드는 "개발자 초대"입니다. */
  label?: string;
  className?: string;
}

/**
 * 초대 버튼과 초대 링크 다이얼로그. 고객에게만 보여 줍니다.
 * 여러 곳에서 반복되는 버튼이라 외곽선으로 둡니다.
 */
const InviteDeveloperButton = ({
  projectId,
  label = '초대',
  className,
}: InviteDeveloperButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const issue = usePostInvitation(projectId);
  const revoke = useDeleteInvitation(projectId);

  const invitation = issue.data;
  const link = invitation ? toInviteLink(invitation.invite_url, window.location.origin) : null;
  const error = issue.error ?? revoke.error;
  const isPending = issue.isPending || revoke.isPending;

  const handleIssue = () => {
    revoke.reset();
    issue.mutate();
  };

  const handleRevoke = () => {
    issue.reset();
    // 발급 기록이 없어도 이전에 만든 링크가 남아 있을 수 있어 항상 보냅니다.
    revoke.mutate();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          'border-divider text-ink hover:bg-hover h-9 shrink-0 rounded-full border bg-white px-4 text-sm font-bold whitespace-nowrap',
          className,
        )}
      >
        {label}
      </button>
      {/* 닫아도 언마운트하지 않아 발급한 링크가 남아 있습니다. */}
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} closeOnBackdropClick={false}>
        <div className="flex flex-col gap-5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <DialogTitle className="tracking-[-0.01em]">개발자 초대</DialogTitle>
              <DialogDescription>
                링크를 받은 사람은 로그인한 뒤 개발자로 참여해요. 링크는 7일 동안 쓸 수 있고, 새로
                발급하면 이전 링크는 더 이상 쓸 수 없어요.
              </DialogDescription>
            </div>
            <DialogClose />
          </div>

          {link && invitation && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  ref={linkInputRef}
                  readOnly
                  value={link}
                  aria-label="초대 링크"
                  onFocus={(event) => event.currentTarget.select()}
                  className="border-field text-ink focus:border-ink h-10 min-w-0 flex-1 rounded-xl border px-3 text-sm outline-none"
                />
                <CopyButton
                  // 새 링크를 발급하면 "복사됨" 표시를 지웁니다.
                  key={link}
                  text={link}
                  copiedLabel="복사됨"
                  // 클립보드 권한이 없으면 사용자가 직접 복사할 수 있게 링크를 선택해 둡니다.
                  onCopyError={() => linkInputRef.current?.select()}
                  className={buttonClassName({ className: 'shrink-0' })}
                />
              </div>
              <p className="text-muted text-xs">
                {formatExpiresAt(invitation.expires_at)}까지 쓸 수 있어요.
              </p>
            </div>
          )}

          {revoke.isSuccess && (
            <p role="status" className="text-text text-sm">
              초대 링크를 비활성화했어요. 이전 링크로는 더 이상 참여할 수 없어요.
            </p>
          )}

          {error && (
            <p role="alert" className="text-warn text-sm font-semibold">
              {toMessage(error)}
            </p>
          )}

          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleRevoke}
              disabled={isPending}
              className="flex-1"
            >
              {revoke.isPending ? '비활성화 중…' : '링크 비활성화'}
            </Button>
            <Button
              onClick={handleIssue}
              disabled={isPending}
              className="bg-brand hover:bg-brand-strong flex-1"
            >
              {issue.isPending ? '발급 중…' : link ? '새 링크 발급' : '링크 발급'}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default InviteDeveloperButton;
