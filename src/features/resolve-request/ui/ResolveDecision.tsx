'use client';

import { type KeyboardEvent, useRef, useState } from 'react';

import { getTransitionErrorMessage } from '@/entities/request';
import { isApiError } from '@/shared/api';
import { shake } from '@/shared/lib';
import { Button, toast } from '@/shared/ui';

import { useReopenChangeRequest, useResolveChangeRequest } from '../api/resolve-request';

interface ResolveDecisionProps {
  projectId: number;
  requestId: number;
  /** 안내 문구("핀 N을 승인했어요")에 씁니다. 핀 없는 요청은 `null` */
  pinNumber: number | null;
  /** 배포본에서 반영 위치를 아직 보지 않았으면 위에 확인 안내를 붙입니다. */
  showLocationHint?: boolean;
}

const toErrorMessage = (error: unknown) =>
  isApiError(error) ? getTransitionErrorMessage(error) : '처리하지 못했어요. 다시 시도해 주세요.';

/**
 * 요청 상세 아래 고객의 검수 결정 (demo-design `renderActions`의 고객 검수 대기).
 * 검수 대기인 요청에서 고객에게만 보여 주세요. 승인은 확인 창 없이 바로 하고,
 * 재수정 요청은 그 자리에 사유 입력칸을 펼칩니다(비우면 흔듭니다).
 */
const ResolveDecision = ({
  projectId,
  requestId,
  pinNumber,
  showLocationHint = false,
}: ResolveDecisionProps) => {
  const [isReopening, setIsReopening] = useState(false);
  const [reason, setReason] = useState('');
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const resolve = useResolveChangeRequest(projectId);
  const reopen = useReopenChangeRequest(projectId);
  const name = pinNumber === null ? '요청' : `핀 ${pinNumber}`;

  const approve = () =>
    resolve.mutate(requestId, {
      onSuccess: () => toast(`${name}을 승인했어요`),
      onError: (error) => toast(toErrorMessage(error)),
    });

  const sendReopen = () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      shake(reasonRef.current);
      return;
    }
    if (reopen.isPending) return;
    reopen.mutate(
      { requestId, reason: trimmed },
      {
        onSuccess: () => {
          toast(`${name} 재수정을 요청했어요`);
          setIsReopening(false);
          setReason('');
        },
        onError: (error) => toast(toErrorMessage(error)),
      },
    );
  };

  // 사유는 여러 줄일 수 있어서 Ctrl/Cmd+Enter로 보내고, Esc로 접습니다.
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape') setIsReopening(false);
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      sendReopen();
    }
  };

  if (isReopening) {
    return (
      <div className="flex flex-col gap-2">
        <textarea
          ref={reasonRef}
          autoFocus
          rows={2}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="어떤 점이 아직 아쉬운지 적어 주세요"
          aria-label="재수정 사유"
          className="border-field focus:border-ink text-ink placeholder:text-faint w-full resize-none rounded-xl border px-3.5 py-3 text-[15px] leading-[1.55] outline-none"
        />
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setIsReopening(false)}
            className="flex-1"
          >
            취소
          </Button>
          <Button size="lg" onClick={sendReopen} disabled={reopen.isPending} className="flex-1">
            {reopen.isPending ? '보내는 중…' : '재수정 요청 보내기'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {showLocationHint && (
        <p className="text-muted text-[13px]">배포본에서 반영 위치를 확인하고 결정해 주세요.</p>
      )}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="lg"
          onClick={() => setIsReopening(true)}
          disabled={resolve.isPending}
          className="flex-1"
        >
          재수정 요청
        </Button>
        <Button size="lg" onClick={approve} disabled={resolve.isPending} className="flex-1">
          {resolve.isPending ? '승인하는 중…' : '승인하기'}
        </Button>
      </div>
    </div>
  );
};

export default ResolveDecision;
