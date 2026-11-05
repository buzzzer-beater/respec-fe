// 초안 생성은 동기 API라 실제 진행률을 받을 수 없습니다.
// 경과 시간으로 단계를 넘기고, 진행 막대는 끝에 닿지 않도록 천천히 채웁니다.

/** 단계 이름과 단계가 시작되는 경과 시간(초). 세 번째 단계 이름에는 사이트 유형이 들어갑니다. */
export const getDraftTasks = (siteTypeLabel: string) =>
  [
    { label: '원하는 방향 정리하기', startsAt: 0 },
    { label: '화면 구성 정하기', startsAt: 10 },
    { label: `${siteTypeLabel} 부품 조합하기`, startsAt: 35 },
    { label: '미리보기 준비하기', startsAt: 75 },
  ] as const;

/** 다 만든 뒤 핀이 떨어지는 장면을 보여 주고 결과 화면으로 넘어가기까지 기다리는 시간 */
export const DRAFT_READY_DELAY_MS = 1800;

const PROGRESS_MAX = 95;
// 60초에 약 70%, 120초에 약 90%가 됩니다.
const PROGRESS_TIME_CONSTANT = 50;

/** 경과 시간(초)에 해당하는 단계 순서 (0~3) */
export const getDraftStepIndex = (elapsedSeconds: number) => {
  let index = 0;
  getDraftTasks('').forEach((task, i) => {
    if (elapsedSeconds >= task.startsAt) index = i;
  });
  return index;
};

/** 경과 시간(초)에 해당하는 진행 막대 비율(0~95) */
export const getDraftProgressPercent = (elapsedSeconds: number) =>
  PROGRESS_MAX * (1 - Math.exp(-Math.max(0, elapsedSeconds) / PROGRESS_TIME_CONSTANT));
