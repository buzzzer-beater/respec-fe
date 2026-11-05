'use client';

import { type FocusEvent, type FormEvent, useState } from 'react';

import {
  getRequestFromMessageErrorMessage,
  usePostRequestFromMessage,
} from '../api/change-request';

/** 관련 핀으로 고를 수 있는 핀 */
export interface RequestPinOption {
  id: number;
  number: number;
  preview: string | null;
}

interface MessageRequestMenuProps {
  projectId: number;
  messageId: number;
  pins: RequestPinOption[];
}

type Step = 'closed' | 'menu' | 'form';

/** 채팅 메시지 메뉴의 "수정 요청으로 등록". 관련 핀은 골라도 되고 안 골라도 됩니다. */
const MessageRequestMenu = ({ projectId, messageId, pins }: MessageRequestMenuProps) => {
  const [step, setStep] = useState<Step>('closed');
  const [pinId, setPinId] = useState('');
  const postRequest = usePostRequestFromMessage(projectId);

  const close = () => {
    setStep('closed');
    setPinId('');
    postRequest.reset();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    postRequest.mutate(
      { messageId, pinId: pinId ? Number(pinId) : undefined },
      { onSuccess: () => setStep('closed') },
    );
  };

  // 메뉴 바깥으로 포커스가 나가면 닫습니다.
  const handleMenuBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setStep('closed');
  };

  if (postRequest.isSuccess) {
    return <p className="text-muted text-xs font-semibold">수정 요청으로 등록했어요</p>;
  }

  if (step === 'form') {
    return (
      <form
        onSubmit={handleSubmit}
        onKeyDown={(event) => event.key === 'Escape' && close()}
        className="border-divider flex w-[260px] flex-col gap-2.5 rounded-xl border bg-white p-3"
      >
        <p className="text-sm font-extrabold">수정 요청으로 등록</p>
        <label className="flex flex-col gap-1">
          <span className="text-muted text-xs font-semibold">관련 핀 (선택)</span>
          <select
            value={pinId}
            onChange={(event) => setPinId(event.target.value)}
            className="border-field focus:border-ink h-9 rounded-[10px] border bg-white px-2.5 text-sm outline-none"
          >
            <option value="">관련 핀 없음</option>
            {pins.map((pin) => (
              <option key={pin.id} value={pin.id}>
                {pin.number}번 핀{pin.preview ? ` · ${pin.preview}` : ''}
              </option>
            ))}
          </select>
        </label>
        {postRequest.error && (
          <p role="alert" className="text-warn text-xs font-semibold">
            {getRequestFromMessageErrorMessage(postRequest.error)}
          </p>
        )}
        <div className="flex justify-end gap-1.5">
          <button
            type="button"
            onClick={close}
            className="text-muted hover:bg-hover rounded-[10px] px-3 py-1.5 text-[13px] font-semibold"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={postRequest.isPending}
            className="bg-ink disabled:bg-divider rounded-[10px] px-3 py-1.5 text-[13px] font-semibold text-white"
          >
            {postRequest.isPending ? '등록 중' : '등록'}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="relative" onBlur={handleMenuBlur}>
      <button
        type="button"
        aria-label="메시지 메뉴"
        aria-haspopup="menu"
        aria-expanded={step === 'menu'}
        onClick={() => setStep(step === 'menu' ? 'closed' : 'menu')}
        className="text-muted hover:text-ink hover:bg-hover rounded-full px-2 py-0.5 text-sm leading-none font-bold opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100 [@media(hover:none)]:opacity-100"
      >
        ···
      </button>
      {step === 'menu' && (
        <div
          role="menu"
          onKeyDown={(event) => event.key === 'Escape' && setStep('closed')}
          className="border-divider absolute top-full left-0 z-10 mt-1 w-max rounded-[10px] border bg-white py-1 shadow-[0_8px_30px_rgba(24,24,27,0.12)]"
        >
          <button
            type="button"
            role="menuitem"
            autoFocus
            // 누르는 순간 포커스가 빠져 메뉴가 먼저 닫히지 않도록 막습니다.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setStep('form')}
            className="hover:bg-hover focus:bg-hover w-full px-3.5 py-2 text-left text-[13px] font-semibold outline-none"
          >
            수정 요청으로 등록
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageRequestMenu;
