'use client';

import { type ReactNode, type SyntheticEvent, useEffect, useId, useRef } from 'react';

interface ModalDialogProps {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}

/** 열린 채로 마운트되는 모달. Esc와 바깥 클릭으로 닫힙니다. */
const ModalDialog = ({ title, description, onClose, children }: ModalDialogProps) => {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  // 안쪽 다이얼로그 이벤트가 바깥으로 올라와도 자기 것만 처리합니다.
  const closeIfSelf = (event: SyntheticEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={closeIfSelf}
      onClick={closeIfSelf}
      className="m-auto w-[400px] max-w-[calc(100%-32px)] rounded-[18px] bg-white p-0 shadow-[0_12px_32px_rgba(24,24,27,0.14)] backdrop:bg-black/40"
    >
      <div className="flex flex-col gap-4 p-6">
        <div className="flex flex-col gap-1.5">
          <h2 id={titleId} className="text-ink text-lg font-extrabold">
            {title}
          </h2>
          {description && <p className="text-muted text-sm leading-relaxed">{description}</p>}
        </div>
        {children}
      </div>
    </dialog>
  );
};

export default ModalDialog;
