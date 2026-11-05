import { useEffect, useRef, useState } from 'react';

import { DRAFT_READY_DELAY_MS } from './progress';

export type DraftStep = 'input' | 'making' | 'done';
/** 만드는 중 화면의 상태. `ready`는 다 만들고 결과로 넘어가기 직전입니다. */
export type DraftMakingStatus = 'making' | 'ready' | 'failed';

/**
 * 초안 화면의 세 단계(입력 → 만드는 중 → 결과)를 관리합니다.
 * 백엔드에 생성 취소가 없어서 "그만 만들기"는 기다리기만 멈춥니다. 늦게 끝난 결과는 화면에 반영하지 않습니다.
 */
export const useDraftFlow = (generate: () => Promise<unknown>) => {
  const [step, setStep] = useState<DraftStep>('input');
  const [status, setStatus] = useState<DraftMakingStatus>('making');
  /** 만드는 중 화면을 시도마다 새로 그리는 데 씁니다(`key`). */
  const [attempt, setAttempt] = useState(0);
  // 시도마다 번호를 매겨, 취소한 시도나 이전 시도의 결과를 무시합니다.
  const attemptRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const start = () => {
    const current = ++attemptRef.current;
    clearTimeout(timerRef.current);
    setAttempt(current);
    setStep('making');
    setStatus('making');
    generate().then(
      () => {
        if (current !== attemptRef.current) return;
        setStatus('ready');
        timerRef.current = setTimeout(() => setStep('done'), DRAFT_READY_DELAY_MS);
      },
      () => {
        if (current === attemptRef.current) setStatus('failed');
      },
    );
  };

  /** 입력 화면으로 돌아갑니다. 적어 둔 내용은 그대로 있습니다. */
  const backToInput = () => {
    attemptRef.current += 1;
    clearTimeout(timerRef.current);
    setStep('input');
  };

  return { step, status, attempt, start, backToInput };
};
