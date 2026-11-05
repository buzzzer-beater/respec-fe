'use client';

import { type MouseEvent, useRef, useState } from 'react';

import type { ProjectInvitation } from '@/entities/project';
import type { ApiError } from '@/shared/api';
import {
  Button,
  buttonClassName,
  CopyButton,
  Dialog,
  DialogBanner,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  toast,
} from '@/shared/ui';

import { useDeleteInvitation, usePostInvitation } from '../api/invitation';
import { readCachedInvitation, writeCachedInvitation } from '../model/invite-cache';
import { toInviteLink } from '../model/invite-link';

const toMessage = (error: ApiError) => {
  if (error.status === 403) return '초대 링크는 프로젝트 고객만 만들거나 끌 수 있어요.';
  return error.message;
};

interface InviteDeveloperButtonProps {
  projectId: number;
  /** 넘기면 대화상자에 "{이름}에 함께할 개발자에게…" 설명을 붙입니다. (프로젝트 목록) */
  projectName?: string;
  /** 버튼 문구. 상단바는 "초대", 프로젝트 카드는 "개발자 초대"입니다. */
  label?: string;
  className?: string;
}

/**
 * demo-design 초대 대화상자. 열면 링크가 바로 보이고, 복사하거나 끌 수 있습니다. 고객에게만 보여 줍니다.
 * 반복되는 버튼이라 외곽선(`.btn-line.btn-sm`)으로 둡니다.
 */
const InviteDeveloperButton = ({
  projectId,
  projectName,
  label = '초대',
  className,
}: InviteDeveloperButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [invitation, setInvitation] = useState<ProjectInvitation | null>(null);
  const [isOff, setIsOff] = useState(false);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const issue = usePostInvitation(projectId);
  const revoke = useDeleteInvitation(projectId);
  const error = issue.error ?? revoke.error;

  const issueLink = (onIssued?: () => void) =>
    issue.mutate(undefined, {
      onSuccess: (issued) => {
        writeCachedInvitation(projectId, issued);
        setInvitation(issued);
        setIsOff(false);
        onIssued?.();
      },
    });

  const handleOpen = (event: MouseEvent) => {
    // 프로젝트 카드 안에서 눌러도 카드가 열리지 않게 합니다.
    event.preventDefault();
    event.stopPropagation();
    setIsOpen(true);
    issue.reset();
    revoke.reset();
    const cached = readCachedInvitation(projectId);
    if (cached) {
      setInvitation(cached);
      setIsOff(false);
    } else if (!isOff) {
      issueLink();
    }
  };

  const handleRevoke = () =>
    revoke.mutate(undefined, {
      onSuccess: () => {
        writeCachedInvitation(projectId, null);
        setInvitation(null);
        setIsOff(true);
        toast('초대 링크를 껐어요');
      },
    });

  const link = invitation ? toInviteLink(invitation.invite_url, window.location.origin) : '';

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={buttonClassName({ variant: 'secondary', size: 'sm', className })}
      >
        {label}
      </button>
      <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
        <DialogContent>
          <div>
            <DialogTitle>개발자 초대</DialogTitle>
            {projectName && (
              <DialogDescription>
                {projectName}에 함께할 개발자에게 링크를 보내 주세요. 링크로 들어오면 개발자로
                참여해요.
              </DialogDescription>
            )}
          </div>

          {isOff ? (
            <DialogBanner className="text-text">
              링크를 껐어요. 이전 링크로는 더 이상 들어올 수 없어요.
            </DialogBanner>
          ) : (
            <div>
              <span className="text-text mb-2 block text-[13px] font-bold">초대 링크</span>
              <div className="flex gap-2">
                <input
                  ref={linkInputRef}
                  readOnly
                  value={issue.isPending ? '링크를 만드는 중…' : link}
                  aria-label="초대 링크"
                  onFocus={(event) => event.currentTarget.select()}
                  className="border-field bg-hover text-text focus:border-ink h-11 min-w-0 flex-1 rounded-xl border px-3.5 text-sm outline-none"
                />
                <CopyButton
                  text={link}
                  copiedMessage="초대 링크를 복사했어요"
                  disabled={!link}
                  // 클립보드 권한이 없으면 사용자가 직접 복사할 수 있게 링크를 선택해 둡니다.
                  onCopyError={() => linkInputRef.current?.select()}
                  className={buttonClassName({ className: 'h-11' })}
                />
              </div>
              <div className="text-faint mt-3 flex items-center justify-between text-xs">
                <span>
                  {projectName ? '링크는 7일 동안 쓸 수 있어요' : '7일 동안 쓸 수 있어요'}
                </span>
                <button
                  type="button"
                  onClick={handleRevoke}
                  disabled={revoke.isPending || !invitation}
                  className="text-muted text-xs underline disabled:opacity-60"
                >
                  링크 끄기
                </button>
              </div>
            </div>
          )}

          {error && (
            <p role="alert" className="text-warn text-[13px] font-semibold">
              {toMessage(error)}
            </p>
          )}

          <DialogFooter>
            <DialogCloseButton />
            {isOff && (
              <Button
                onClick={() => issueLink(() => toast('새 초대 링크를 만들었어요'))}
                disabled={issue.isPending}
              >
                새 링크 만들기
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InviteDeveloperButton;
