import type { PinSource } from '@/entities/pin';

import type { PinThread } from './types';

/** 요청이 지금 보는 사이트의 어느 페이지에 보이는지 */
export interface ThreadPlacement {
  pagePath: string;
  /** 원래 핀이 아니라 개발자가 배포본에 찍은 반영 위치로 보이는지("반영 위치" 표시) */
  byReview: boolean;
}

/**
 * 초안 핀은 초안에서만, 배포본 핀은 배포본에서만 그 자리에 보입니다.
 * 배포본에서는 초안 핀도 개발자가 검수 요청 때 찍은 반영 위치로 보여 줍니다. (demo-design `posFor`)
 * 핀 없는 요청이나 이 사이트에 자리가 없는 요청은 `null`입니다.
 */
export const getThreadPlacement = (
  thread: Pick<PinThread, 'source' | 'pagePath' | 'reviewPagePath'>,
  site: PinSource,
): ThreadPlacement | null => {
  if (thread.source === site && thread.pagePath !== null) {
    return { pagePath: thread.pagePath, byReview: false };
  }
  if (site === 'deployment' && thread.reviewPagePath !== null) {
    return { pagePath: thread.reviewPagePath, byReview: true };
  }
  return null;
};

/**
 * 목록을 이 페이지 요청과 다른 곳 요청으로 나눕니다.
 * `currentPath`를 모르면(`null`) 이 사이트에 자리가 있는 요청을 모두 이 페이지 요청으로 봅니다.
 * `elsewhere`는 해결되지 않은 나머지(핀 없는 요청 포함) 개수입니다.
 */
export const splitThreadsByPage = (
  threads: PinThread[],
  site: PinSource,
  currentPath: string | null,
) => {
  const here: { thread: PinThread; byReview: boolean }[] = [];
  let elsewhere = 0;
  for (const thread of threads) {
    const placement = getThreadPlacement(thread, site);
    if (placement && (currentPath === null || placement.pagePath === currentPath)) {
      here.push({ thread, byReview: placement.byReview });
    } else if (thread.status !== 'resolved') {
      elsewhere += 1;
    }
  }
  return { here, elsewhere };
};
