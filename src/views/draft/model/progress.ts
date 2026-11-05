// 초안 생성은 동기 API라 실제 진행률을 받을 수 없습니다.
// 경과 시간으로 단계를 넘기고, 진행 막대는 끝에 닿지 않도록 천천히 채웁니다.

export interface DraftProgressStep {
  /** 단계 목록에 쓰는 짧은 이름 */
  label: string;
  /** 지금 이 단계일 때 크게 보여 주는 문장 */
  message: string;
  /** 이 단계가 시작되는 경과 시간(초) */
  startsAt: number;
}

export const DRAFT_PROGRESS_STEPS: readonly DraftProgressStep[] = [
  { label: '요청 내용 읽기', message: '요청 내용을 읽고 있어요', startsAt: 0 },
  { label: '화면 구조 짜기', message: '화면 구조를 짜고 있어요', startsAt: 10 },
  { label: '디자인과 문구 입히기', message: '디자인과 문구를 입히고 있어요', startsAt: 35 },
  { label: '마무리하기', message: '마지막으로 다듬고 있어요', startsAt: 75 },
];

/** 이 시간이 지나면 조금 더 기다려 달라는 안내를 보여 줍니다. */
export const DRAFT_SLOW_AFTER_SECONDS = 90;

const PROGRESS_MAX = 95;
// 60초에 약 70%, 120초에 약 90%가 됩니다.
const PROGRESS_TIME_CONSTANT = 50;

/** 경과 시간(초)에 해당하는 단계 순서 */
export const getDraftStepIndex = (elapsedSeconds: number) => {
  let index = 0;
  DRAFT_PROGRESS_STEPS.forEach((step, i) => {
    if (elapsedSeconds >= step.startsAt) index = i;
  });
  return index;
};

/** 경과 시간(초)에 해당하는 진행 막대 비율(0~95) */
export const getDraftProgressPercent = (elapsedSeconds: number) =>
  PROGRESS_MAX * (1 - Math.exp(-Math.max(0, elapsedSeconds) / PROGRESS_TIME_CONSTANT));

/** 경과 시간(초)을 "0:07", "1:42"처럼 바꿉니다. */
export const formatElapsed = (elapsedSeconds: number) => {
  const total = Math.max(0, Math.floor(elapsedSeconds));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};
