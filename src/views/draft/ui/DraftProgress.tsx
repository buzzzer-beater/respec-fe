'use client';

import { useEffect, useState } from 'react';

import { cn } from '@/shared/lib';
import { Button, Icon } from '@/shared/ui';

import { getDraftProgressPercent, getDraftStepIndex, getDraftTasks } from '../model/progress';
import type { DraftMakingStatus } from '../model/use-draft-flow';

interface DraftProgressProps {
  /** 세 번째 단계 이름에 넣을 사이트 유형 (예: 쇼핑몰) */
  siteTypeLabel: string;
  status: DraftMakingStatus;
  /** 실패 안내의 "내용 고치기"와 "그만 만들고 돌아가기" */
  onBack: () => void;
  onRetry: () => void;
}

const SHIMMER =
  'animate-[shimmer_1.2s_linear_infinite] bg-[linear-gradient(90deg,#f4f4f6_25%,#ebebef_50%,#f4f4f6_75%)] bg-size-[200%_100%]';

type BlockState = 'todo' | 'now' | 'done' | 'failed';

/** 조립 전: 점선 자리 / 지금: 반짝임 / 끝: 채워짐 / 실패: 주황 */
const blockClass = (state: BlockState) =>
  cn(
    'rounded-lg transition-shadow duration-300',
    state === 'todo' && 'shadow-[inset_0_0_0_1.5px_#e4e4e9] [&>*]:opacity-0',
    state === 'now' && cn(SHIMMER, '[&>*]:opacity-0'),
    state === 'failed' && 'bg-warn-soft [&>*]:opacity-0',
    state === 'done' &&
      'animate-[pop-in_0.45s_var(--ease-spring)] [&>*]:opacity-100 [&>*]:transition-opacity [&>*]:duration-300',
  );

/** 단계마다 조립되는 작은 사이트. 다 만들면 핀이 떨어지며 다음 할 일을 알려 줍니다. */
const BuildScene = ({ current, status }: { current: number; status: DraftMakingStatus }) => {
  const stateAt = (at: number): BlockState =>
    at < current ? 'done' : at === current ? (status === 'failed' ? 'failed' : 'now') : 'todo';
  const cardsState = stateAt(2);

  return (
    <div
      aria-hidden
      className="relative hidden animate-[pop-in_0.5s_var(--ease-out-soft)] gap-3 rounded-[14px] bg-white p-5 shadow-[0_0_0_1px_rgba(24,24,27,0.05),0_12px_36px_rgba(24,24,27,0.08)] min-[961px]:grid"
    >
      <div className="border-divider flex gap-1.5 border-b pb-3">
        <i className="bg-chip size-2 rounded-full" />
        <i className="bg-chip size-2 rounded-full" />
        <i className="bg-chip size-2 rounded-full" />
      </div>
      <div className={cn('flex h-7 items-center gap-2.5 px-1', blockClass(stateAt(0)))}>
        <b className="bg-ink h-3 w-16 rounded" />
        <i className="bg-chip ml-auto h-2 w-9 rounded" />
        <i className="bg-chip h-2 w-9 rounded" />
        <i className="bg-chip h-2 w-9 rounded" />
      </div>
      <div className={cn('relative h-[150px]', blockClass(stateAt(1)))}>
        <div className="bg-stage grid h-full place-content-center justify-items-center gap-2.5 rounded-lg">
          <b className="h-4 w-[180px] rounded-[5px] bg-[#cfcfd6]" />
          <i className="bg-ink h-7 w-[110px] rounded-lg" />
        </div>
      </div>
      {/* 카드 줄은 칸마다 따로 반짝이고 차례로 나타납니다. */}
      <div className="grid h-24 grid-cols-3 gap-2.5">
        {[0, 1, 2].map((index) => (
          <i
            key={index}
            style={cardsState === 'done' ? { animationDelay: `${index * 80}ms` } : undefined}
            className={cn(
              'rounded-lg',
              cardsState === 'todo' && 'shadow-[inset_0_0_0_1.5px_#e4e4e9]',
              cardsState === 'now' && SHIMMER,
              cardsState === 'failed' && 'bg-warn-soft',
              cardsState === 'done' &&
                'bg-stage animate-[pop-in_0.45s_var(--ease-spring)_backwards]',
            )}
          />
        ))}
      </div>
      <div className={cn('flex h-3.5 gap-2', blockClass(stateAt(3)))}>
        <i className="bg-chip h-2 w-[22%] rounded" />
        <i className="bg-chip h-2 w-[22%] rounded" />
        <i className="bg-chip h-2 w-[22%] rounded" />
      </div>
      {status === 'ready' && (
        <>
          <span className="bg-brand absolute top-[150px] left-[calc(50%+60px)] grid size-[30px] -translate-y-full animate-[drop_0.5s_var(--ease-out-soft)_both] place-items-center rounded-[50%_50%_50%_6px] text-[13px] font-extrabold text-white">
            1
          </span>
          <p className="absolute top-24 left-[calc(50%+100px)] animate-[pop-in_0.4s_0.35s_var(--ease-out-soft)_both] rounded-[4px_14px_14px_14px] bg-white px-3.5 py-2.5 text-[13px] leading-normal whitespace-nowrap shadow-[0_6px_18px_rgba(24,24,27,0.12)]">
            마음에 안 드는 곳은 여기처럼 짚어서 말하면 돼요
          </p>
        </>
      )}
    </div>
  );
};

const TITLE: Record<DraftMakingStatus, string> = {
  making: '초안을 만들고 있어요',
  ready: '초안이 다 됐어요',
  failed: '초안을 만들지 못했어요',
};

/** demo-design `.step-making`: 왼쪽은 조립되는 사이트, 오른쪽은 지금 하는 일 */
const DraftProgress = ({ siteTypeLabel, status, onBack, onRetry }: DraftProgressProps) => {
  const [elapsed, setElapsed] = useState(0);
  const [frozen, setFrozen] = useState<{ index: number; percent: number } | null>(null);
  const tasks = getDraftTasks(siteTypeLabel);
  const isMaking = status === 'making';

  useEffect(() => {
    if (!isMaking) return;
    // 다시 시도하면 이 화면이 새로 마운트되어 0부터 셉니다.
    const startedAt = Date.now();
    const id = window.setInterval(() => setElapsed((Date.now() - startedAt) / 1000), 1000);
    return () => window.clearInterval(id);
  }, [isMaking]);

  // 생성 중에 새로고침하거나 탭을 닫으려 하면 브라우저 확인 창을 띄웁니다.
  useEffect(() => {
    if (!isMaking) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isMaking]);

  // 실패하면 그때의 단계와 막대에서 멈춥니다.
  const live = { index: getDraftStepIndex(elapsed), percent: getDraftProgressPercent(elapsed) };
  if (status === 'failed' && !frozen) setFrozen(live);
  if (status !== 'failed' && frozen) setFrozen(null);

  const current = status === 'ready' ? tasks.length : (frozen ?? live).index;
  const percent = status === 'ready' ? 100 : Math.max(4, (frozen ?? live).percent);

  return (
    <section
      aria-live="polite"
      className="flex min-h-full flex-col items-center justify-center p-10"
    >
      <div className="grid w-[min(1040px,100%)] grid-cols-1 items-center gap-14 min-[961px]:grid-cols-[minmax(0,1fr)_400px]">
        <BuildScene current={current} status={status} />
        <div className="grid min-w-0 gap-7">
          <div>
            <h2 className="text-[26px] font-extrabold">{TITLE[status]}</h2>
            <p className="text-muted mt-2 text-sm">
              보통 1~2분 걸려요. 다 만들 때까지 이 화면을 닫지 말아 주세요.
            </p>
          </div>
          <div
            role="progressbar"
            aria-label="초안 만드는 중"
            aria-valuenow={Math.round(percent)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="bg-stage h-1.5 overflow-hidden rounded-[3px]"
          >
            <i
              className="bg-brand block h-full rounded-[3px] transition-[width] duration-600 ease-[var(--ease-out-soft)]"
              style={{ width: `${percent}%` }}
            />
          </div>
          <ul className="grid gap-1">
            {tasks.map((task, index) => {
              const state = index < current ? 'done' : index === current ? 'now' : 'todo';
              return (
                <li
                  key={task.label}
                  aria-current={state === 'now' ? 'step' : undefined}
                  className={cn(
                    'flex h-12 items-center gap-3 rounded-xl px-4 text-[15px] font-semibold transition-colors duration-200',
                    state === 'done' && 'text-text',
                    state === 'now' && 'bg-ai text-ink',
                    state === 'todo' && 'text-faint',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-[22px] shrink-0 place-items-center rounded-full text-white',
                      state === 'done' && 'bg-ink',
                      state === 'now' &&
                        'animate-[pulse-soft_1s_ease-in-out_infinite] shadow-[inset_0_0_0_2px_var(--color-ink)]',
                      state === 'todo' && 'bg-stage',
                    )}
                  >
                    {state === 'done' && <Icon name="check" size={12} />}
                  </span>
                  {task.label}
                </li>
              );
            })}
          </ul>
          {status === 'failed' ? (
            <div
              role="alert"
              className="bg-warn-soft text-warn-strong grid gap-1.5 rounded-[14px] p-[18px]"
            >
              <b className="text-sm">초안을 만들지 못했어요</b>
              <span className="text-[13px] leading-normal">
                잠시 뒤 다시 시도해 주세요. 적어 둔 내용은 그대로 있어요.
              </span>
              <div className="mt-2 flex gap-2">
                <Button variant="secondary" onClick={onBack} className="h-[42px] flex-1">
                  내용 고치기
                </Button>
                <Button onClick={onRetry} className="h-[42px] flex-1">
                  다시 시도
                </Button>
              </div>
            </div>
          ) : (
            status === 'making' && (
              <button
                type="button"
                onClick={onBack}
                className="text-muted justify-self-start text-[13px] underline"
              >
                그만 만들고 돌아가기
              </button>
            )
          )}
        </div>
      </div>
    </section>
  );
};

export default DraftProgress;
