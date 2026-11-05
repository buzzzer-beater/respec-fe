import { type ApiError, isApiError } from './error';

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiError;
  }
}

/** 4xx는 다시 요청해도 결과가 같으므로 재시도하지 않습니다. */
export const retryQuery = (failureCount: number, error: unknown) => {
  if (isApiError(error) && error.status >= 400 && error.status < 500) return false;
  return failureCount < 1;
};
