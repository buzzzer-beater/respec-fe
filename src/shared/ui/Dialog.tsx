'use client';

import {
  type ComponentProps,
  createContext,
  type SyntheticEvent,
  use,
  useEffect,
  useId,
  useRef,
} from 'react';

import { cn } from '@/shared/lib';

import { buttonClassName } from './Button';
import { type DialogClosePolicy, isOwnDialogEvent, shouldCloseDialog } from './dialog-close';

interface DialogContextValue {
  titleId: string;
  /** 닫기 버튼용. `preventClose`면 무시합니다. */
  close: () => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

const useDialogContext = () => {
  const context = use(DialogContext);
  if (!context) throw new Error('Dialog 안에서만 쓸 수 있어요.');
  return context;
};

const SIDE_CLASS = {
  // demo-design `.modal`: 460px, 둥글기 20px, 아래에서 살짝 떠오르며 열립니다.
  center:
    'm-auto w-[460px] max-w-[calc(100vw-32px)] rounded-[20px] shadow-modal animate-[modal-in_0.35s_var(--ease-spring)] backdrop:bg-[rgba(24,24,27,0.32)] backdrop:animate-[fade-in_0.2s]',
  right:
    'fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-[480px] max-w-full animate-[slide-in_0.3s_var(--ease-out-soft)] shadow-[0_0_0_1px_var(--color-divider),0_12px_32px_rgba(24,24,27,0.14)] backdrop:bg-black/30',
} as const;

export interface DialogProps
  extends
    DialogClosePolicy,
    Omit<ComponentProps<'dialog'>, 'open' | 'onClose' | 'onCancel' | 'onClick'> {
  /** 생략하면 열린 채로 마운트됩니다. 열 때 마운트하고 닫을 때 언마운트하는 방식이면 생략하세요. */
  open?: boolean;
  /** Esc, 바깥 클릭, `DialogClose`로 닫을 때 부릅니다. 부모가 `open`을 내리거나 언마운트하세요. */
  onClose: () => void;
  /** `right`는 오른쪽 드로어입니다. */
  side?: keyof typeof SIDE_CLASS;
}

/**
 * 네이티브 `<dialog>` 모달. 제목은 `DialogTitle`로 넣으면 `aria-labelledby`가 연결됩니다.
 * 처음 포커스는 브라우저가 첫 번째 포커스 가능한 요소로 옮기고, 닫히면 열기 전 요소로 돌려줍니다.
 */
export const Dialog = ({
  open = true,
  onClose,
  side = 'center',
  closeOnBackdropClick,
  preventClose,
  className,
  children,
  ...props
}: DialogProps) => {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const policy = { closeOnBackdropClick, preventClose };

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!open) {
      if (node.open) node.close();
      return;
    }

    const previous = document.activeElement;
    if (!node.open) node.showModal();
    return () => {
      // 언마운트로 사라지면 close가 일어나지 않아 브라우저가 포커스를 돌려주지 않습니다.
      if (!node.isConnected && previous instanceof HTMLElement && previous.isConnected) {
        previous.focus();
      }
    };
  }, [open]);

  const close = () => {
    if (shouldCloseDialog('button', policy)) onClose();
  };

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    if (isOwnDialogEvent(event) && !shouldCloseDialog('escape', policy)) event.preventDefault();
  };

  const handleClose = (event: SyntheticEvent<HTMLDialogElement>) => {
    if (isOwnDialogEvent(event)) onClose();
  };

  const handleClick = (event: SyntheticEvent<HTMLDialogElement>) => {
    if (isOwnDialogEvent(event) && shouldCloseDialog('backdrop', policy)) onClose();
  };

  return (
    <DialogContext value={{ titleId, close }}>
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        onCancel={handleCancel}
        onClose={handleClose}
        onClick={handleClick}
        className={cn('bg-white p-0', SIDE_CLASS[side], className)}
        {...props}
      >
        {children}
      </dialog>
    </DialogContext>
  );
};

/**
 * 가운데 모달의 내용 틀(여백 32px, 간격 20px). 바깥 클릭을 알아보려면 여백을 `<dialog>`가 아니라 이 안에 둡니다.
 * 열을 `minmax(0,1fr)`로 두어, 줄바꿈 없는 긴 내용(코드 한 줄 등)이 모달 폭을 넘어 오른쪽 여백을 먹지 않게 합니다.
 */
export const DialogContent = ({ className, ...props }: ComponentProps<'div'>) => (
  <div className={cn('grid grid-cols-[minmax(0,1fr)] gap-5 p-8', className)} {...props} />
);

export const DialogTitle = ({ className, ...props }: ComponentProps<'h2'>) => {
  const { titleId } = useDialogContext();
  return (
    <h2
      id={titleId}
      className={cn('text-ink text-[22px] font-extrabold tracking-[-0.01em]', className)}
      {...props}
    />
  );
};

export const DialogDescription = ({ className, ...props }: ComponentProps<'p'>) => (
  <p className={cn('text-muted mt-1.5 text-sm leading-[1.6]', className)} {...props} />
);

/** 모달 아래 버튼 줄. 오른쪽에 붙습니다. */
export const DialogFooter = ({ className, ...props }: ComponentProps<'div'>) => (
  <div className={cn('flex justify-end gap-2', className)} {...props} />
);

/** 모달 위 회색 안내 (`.modal-banner`) */
export const DialogBanner = ({ className, ...props }: ComponentProps<'p'>) => (
  <p
    className={cn('bg-hover text-ink rounded-xl px-3.5 py-3 text-[13px] font-semibold', className)}
    {...props}
  />
);

/** 아래 "닫기"처럼 글자로 된 닫기 버튼. `preventClose`면 닫지 않습니다. */
export const DialogCloseButton = ({
  className,
  children = '닫기',
  ...props
}: ComponentProps<'button'>) => {
  const { close } = useDialogContext();
  return (
    <button
      type="button"
      onClick={close}
      className={buttonClassName({ variant: 'secondary', className })}
      {...props}
    >
      {children}
    </button>
  );
};

/** 오른쪽 위 × 버튼 */
export const DialogClose = ({ className, ...props }: ComponentProps<'button'>) => {
  const { close } = useDialogContext();
  return (
    <button
      type="button"
      onClick={close}
      aria-label="닫기"
      className={cn(
        'text-muted hover:bg-hover hover:text-ink grid size-8 shrink-0 place-items-center rounded-full text-lg',
        className,
      )}
      {...props}
    >
      ×
    </button>
  );
};
