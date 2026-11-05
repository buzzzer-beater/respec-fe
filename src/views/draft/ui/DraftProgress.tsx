'use client';

import { useEffect, useState } from 'react';

import { cn } from '@/shared/lib';

import {
  DRAFT_PROGRESS_STEPS,
  DRAFT_SLOW_AFTER_SECONDS,
  formatElapsed,
  getDraftProgressPercent,
  getDraftStepIndex,
} from '../model/progress';

interface DraftProgressProps {
  /** 고객이 보낸 설명. 무엇을 만드는 중인지 보여 줍니다. */
  prompt: string | null;
  /** 새 프로젝트를 만들 때만 넘깁니다. 프로젝트 만들기 단계를 목록 맨 앞에 붙입니다. */
  projectStep?: 'pending' | 'done';
  /** 생성이 끝나 작업 화면으로 이동하는 중입니다. */
  isDone?: boolean;
}

const PROJECT_STEP = { label: '프로젝트 만들기', message: '프로젝트를 만들고 있어요' };

/** 초안 생성 중 화면. 경과 시간에 따라 단계와 진행 막대를 바꿉니다. */
const DraftProgress = ({ prompt, projectStep, isDone = false }: DraftProgressProps) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (isDone) return;
    // 끝나면 타이머만 멈춥니다. 다시 생성하면 이 화면이 새로 마운트되어 0부터 셉니다.
    const startedAt = Date.now();
    const id = window.setInterval(() => setElapsed((Date.now() - startedAt) / 1000), 1000);
    return () => window.clearInterval(id);
  }, [isDone]);

  // 생성 중에 새로고침하거나 탭을 닫으려 하면 브라우저 확인 창을 띄웁니다.
  useEffect(() => {
    if (isDone) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDone]);

  const creatingProject = projectStep === 'pending';
  const steps = projectStep ? [PROJECT_STEP, ...DRAFT_PROGRESS_STEPS] : DRAFT_PROGRESS_STEPS;
  const offset = projectStep ? 1 : 0;
  // 끝나면 모든 단계를 완료로 보여 줍니다.
  const currentIndex = isDone
    ? steps.length
    : creatingProject
      ? 0
      : getDraftStepIndex(elapsed) + offset;
  const percent = isDone
    ? 100
    : creatingProject
      ? 2
      : Math.max(4, getDraftProgressPercent(elapsed));
  const isSlow = !isDone && elapsed >= DRAFT_SLOW_AFTER_SECONDS;

  return (
    <div className="flex w-full max-w-xl animate-[slide-in_0.3s_var(--ease-out-soft)] flex-col items-center gap-8 py-10 pb-20">
      <SitePlaceholder />

      <div className="flex w-full flex-col items-center gap-2 text-center">
        <h1 className="text-[28px] font-extrabold tracking-[-0.02em] sm:text-[32px]">
          {isDone ? '초안을 다 만들었어요' : '초안을 만들고 있어요'}
        </h1>
        <p role="status" className="text-brand text-base font-semibold">
          {isDone ? '작업 화면으로 이동하고 있어요' : steps[currentIndex].message}
        </p>
      </div>

      <div className="flex w-full flex-col gap-2">
        <div className="bg-stage h-2 w-full overflow-hidden rounded-full" aria-hidden>
          <div
            className="bg-brand h-full rounded-full transition-[width] duration-1000 ease-linear"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-muted flex justify-between text-[13px] tabular-nums">
          <span>보통 1~2분 걸려요</span>
          <span>
            <span className="sr-only">경과 시간 </span>
            {formatElapsed(elapsed)}
          </span>
        </p>
      </div>

      <ol className="flex w-full flex-col gap-2.5">
        {steps.map((step, index) => (
          <StepItem
            key={step.label}
            label={step.label}
            state={index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'upcoming'}
          />
        ))}
      </ol>

      {prompt && (
        <blockquote className="bg-stage text-text w-full rounded-2xl px-5 py-4 text-sm leading-relaxed whitespace-pre-line">
          <span className="text-muted mb-1 block text-xs font-semibold">요청한 내용</span>
          {prompt}
        </blockquote>
      )}

      <p className="text-muted text-center text-sm">
        {isSlow
          ? '평소보다 조금 오래 걸리고 있어요. 거의 다 됐으니 조금만 더 기다려 주세요.'
          : '다 만들면 작업 화면으로 바로 이동해요. 이 창을 닫지 말아 주세요.'}
      </p>
    </div>
  );
};

const StepItem = ({ label, state }: { label: string; state: 'done' | 'current' | 'upcoming' }) => (
  <li
    aria-current={state === 'current' ? 'step' : undefined}
    className={cn(
      'flex items-center gap-3 text-sm transition-colors',
      state === 'done' && 'text-muted',
      state === 'current' && 'text-ink font-semibold',
      state === 'upcoming' && 'text-faint',
    )}
  >
    <span className="grid size-5 shrink-0 place-items-center" aria-hidden>
      {state === 'done' && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-brand">
          <path
            d="M5 12.5l4.5 4.5L19 7.5"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {state === 'current' && (
        <span className="border-brand-soft border-t-brand size-4 rounded-full border-2 motion-safe:animate-spin" />
      )}
      {state === 'upcoming' && <span className="bg-divider size-2 rounded-full" />}
    </span>
    {label}
    {state === 'done' && <span className="sr-only">(완료)</span>}
  </li>
);

// 사이트 화면이 조금씩 채워지는 느낌을 주는 뼈대 그림입니다.
const SitePlaceholder = () => (
  <div
    aria-hidden
    className="border-divider w-full max-w-sm overflow-hidden rounded-2xl border bg-white shadow-[0_12px_32px_rgba(24,24,27,0.08)]"
  >
    <div className="border-divider flex items-center gap-1.5 border-b px-3 py-2.5">
      <span className="bg-divider size-2 rounded-full" />
      <span className="bg-divider size-2 rounded-full" />
      <span className="bg-divider size-2 rounded-full" />
    </div>
    <div className="flex flex-col gap-3 p-4">
      <Block className="bg-brand-soft h-16 w-full" delay={0} />
      <Block className="h-3 w-2/3" delay={150} />
      <Block className="h-3 w-1/2" delay={300} />
      <div className="grid grid-cols-3 gap-2">
        <Block className="h-12" delay={450} />
        <Block className="h-12" delay={600} />
        <Block className="h-12" delay={750} />
      </div>
    </div>
  </div>
);

const Block = ({ className, delay }: { className: string; delay: number }) => (
  <span
    className={cn('bg-stage block rounded-lg motion-safe:animate-pulse', className)}
    style={{ animationDelay: `${delay}ms` }}
  />
);

export default DraftProgress;
