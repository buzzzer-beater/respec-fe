'use client';

import { useEffect, useRef, useState } from 'react';

import type { ApiError } from '@/shared/api';

import { useDeleteInvitation, usePostInvitation } from '../api/invitation';
import { toInviteLink } from '../model/invite-link';

const COPIED_DURATION_MS = 2000;

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
}

/** 상단바의 "초대" 버튼과 초대 링크 다이얼로그. 고객에게만 보여 줍니다. */
const InviteDeveloperButton = ({ projectId }: InviteDeveloperButtonProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const issue = usePostInvitation(projectId);
  const revoke = useDeleteInvitation(projectId);
  const [copied, setCopied] = useState(false);

  const invitation = issue.data;
  const link = invitation ? toInviteLink(invitation.invite_url, window.location.origin) : null;
  const error = issue.error ?? revoke.error;
  const isPending = issue.isPending || revoke.isPending;

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), COPIED_DURATION_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleIssue = () => {
    revoke.reset();
    setCopied(false);
    issue.mutate();
  };

  const handleRevoke = () => {
    issue.reset();
    setCopied(false);
    // 발급 기록이 없어도 이전에 만든 링크가 남아 있을 수 있어 항상 보냅니다.
    revoke.mutate();
  };

  const handleCopy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      // 클립보드 권한이 없으면 사용자가 직접 복사할 수 있게 링크를 선택해 둡니다.
      dialogRef.current?.querySelector('input')?.select();
    }
  };

  const buttonClassName =
    'h-10 rounded-xl px-4 text-sm font-semibold transition-transform active:scale-95 disabled:opacity-40';

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="bg-ink h-9 rounded-full px-4 text-sm font-bold text-white transition-transform hover:bg-[#34322e] active:scale-95"
      >
        초대
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="invite-dialog-title"
        className="m-auto w-[min(440px,calc(100vw-32px))] rounded-[18px] bg-white p-6 shadow-[0_0_0_1px_var(--color-divider),0_24px_64px_rgba(24,24,27,0.18)] backdrop:bg-black/30"
      >
        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <h2 id="invite-dialog-title" className="text-lg font-extrabold tracking-[-0.01em]">
                개발자 초대
              </h2>
              <p className="text-muted text-sm leading-relaxed">
                링크를 받은 사람은 로그인한 뒤 개발자로 참여해요. 링크는 7일 동안 쓸 수 있고, 새로
                발급하면 이전 링크는 더 이상 쓸 수 없어요.
              </p>
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="닫기"
              className="text-muted hover:bg-hover hover:text-ink grid size-8 shrink-0 place-items-center rounded-full text-lg"
            >
              ×
            </button>
          </div>

          {link && invitation && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  readOnly
                  value={link}
                  aria-label="초대 링크"
                  onFocus={(event) => event.currentTarget.select()}
                  className="border-field text-ink h-10 min-w-0 flex-1 rounded-xl border px-3 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`${buttonClassName} bg-ink shrink-0 text-white`}
                >
                  {copied ? '복사됨' : '복사'}
                </button>
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
            <button
              type="button"
              onClick={handleRevoke}
              disabled={isPending}
              className={`${buttonClassName} border-divider text-ink hover:bg-hover flex-1 border`}
            >
              {revoke.isPending ? '비활성화 중…' : '링크 비활성화'}
            </button>
            <button
              type="button"
              onClick={handleIssue}
              disabled={isPending}
              className={`${buttonClassName} bg-brand hover:bg-brand-strong flex-1 text-white`}
            >
              {issue.isPending ? '발급 중…' : link ? '새 링크 발급' : '링크 발급'}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
};

export default InviteDeveloperButton;
