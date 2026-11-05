import { isPublicPath, toLoginPath } from '@/shared/lib';

import { isApiError } from './error';
import { createApiClient } from './factory';
import { getAccessToken, setAccessToken } from './token';

export const axiosInstance = createApiClient({
  baseURL: '/backend',
  timeout: 10000,
});

axiosInstance.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 토큰이 만료(1시간)되면 로그인 화면으로 보내고, 로그인 후 지금 페이지로 돌아오게 합니다. 리프레시 토큰은 없습니다.
// 저장된 토큰이 없을 때(로그아웃 직후 등)는 보내지 않습니다. 로그인 안 한 사용자는 `AuthGuard`가 막습니다.
axiosInstance.interceptors.response.use(null, (error: unknown) => {
  const { pathname, search } = window.location;
  if (
    isApiError(error) &&
    error.status === 401 &&
    getAccessToken() !== null &&
    !isPublicPath(pathname)
  ) {
    setAccessToken(null);
    // 컴포넌트 밖(axios 인터셉터)이라 router를 쓸 수 없어서 페이지를 새로 엽니다.
    window.location.assign(toLoginPath(`${pathname}${search}`));
  }
  return Promise.reject(error);
});
