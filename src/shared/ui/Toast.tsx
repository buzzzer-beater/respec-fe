'use client';

import { useSyncExternalStore } from 'react';

// demo-design `.toast`: 아래 가운데에 잠깐(2.2초) 뜨는 검정 안내입니다. 한 번에 하나만 보입니다.
const TOAST_DURATION_MS = 2200;

interface ToastState {
  id: number;
  message: string;
}

let current: ToastState | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

/** 화면 아래에 짧은 안내를 띄웁니다. 이미 떠 있으면 새 문구로 바꿉니다. */
export const toast = (message: string) => {
  current = { id: (current?.id ?? 0) + 1, message };
  emit();
  clearTimeout(timer);
  timer = setTimeout(() => {
    current = null;
    emit();
  }, TOAST_DURATION_MS);
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** 루트 레이아웃에 한 번 둡니다. */
export const Toaster = () => {
  const state = useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-7 z-50 flex justify-center px-4"
    >
      {state && (
        <p
          key={state.id}
          className="bg-ink shadow-card animate-[toast-in_0.35s_var(--ease-spring)] rounded-[14px] px-[18px] py-[11px] text-sm font-semibold text-white"
        >
          {state.message}
        </p>
      )}
    </div>
  );
};
