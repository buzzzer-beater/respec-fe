import { isApiError } from './error';
import { createApiClient } from './factory';
import { getAccessToken, setAccessToken } from './token';

export const LOGIN_PATH = '/login';
const AUTH_PATHS = [LOGIN_PATH, '/signup'];

export const axiosInstance = createApiClient({
  baseURL: '/backend',
  timeout: 10000,
});

axiosInstance.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 토큰이 없거나 만료(1시간)되면 로그인 화면으로 보냅니다. 리프레시 토큰은 없습니다.
axiosInstance.interceptors.response.use(null, (error: unknown) => {
  if (isApiError(error) && error.status === 401 && !AUTH_PATHS.includes(window.location.pathname)) {
    setAccessToken(null);
    // 컴포넌트 밖(axios 인터셉터)이라 router를 쓸 수 없어서 페이지를 새로 엽니다.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(LOGIN_PATH);
  }
  return Promise.reject(error);
});
