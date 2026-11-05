import { useSyncExternalStore } from 'react';

import { getAccessToken, subscribeAccessToken } from '@/shared/api';

const hasAccessToken = () => getAccessToken() !== null;
// 서버에서는 localStorage를 읽을 수 없으므로 "아직 모름"으로 둡니다.
const unknownOnServer = () => null;

/**
 * 저장된 토큰이 있는지 돌려줍니다. 서버 렌더링과 hydration 중에는 `null`(아직 모름)입니다.
 * 렌더링할 때마다 다시 읽고, 다른 탭에서 토큰이 바뀌면 다시 렌더링합니다.
 */
export const useHasAccessToken = (): boolean | null =>
  useSyncExternalStore(subscribeAccessToken, hasAccessToken, unknownOnServer);
