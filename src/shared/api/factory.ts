import axios, { type AxiosInstance, type AxiosResponse, type CreateAxiosDefaults } from 'axios';

import { toApiError } from './error';
import { type FileResponse, parseBlobErrorBody, parseContentDispositionFilename } from './file';
import type { ApiResponse } from './types';

/** 실패 응답을 모두 `ApiError`로 바꾸는 axios 인스턴스를 만듭니다. */
export const createApiClient = (config: CreateAxiosDefaults): AxiosInstance => {
  const instance = axios.create(config);
  instance.interceptors.response.use(null, async (error: unknown) =>
    Promise.reject(toApiError(await parseBlobErrorBody(error))),
  );
  return instance;
};

// 204 응답은 본문이 없습니다.
const unwrap = <T>(response: AxiosResponse<ApiResponse<T>>): T =>
  (response.status === 204 ? undefined : response.data.data) as T;

/** 백엔드 `{ data }` 응답에서 `data`를 꺼내 반환하는 메서드를 만듭니다. */
export const createMethods = (instance: AxiosInstance) => ({
  del: async <T>(...args: Parameters<AxiosInstance['delete']>): Promise<T> =>
    unwrap<T>(await instance.delete<ApiResponse<T>>(...args)),
  get: async <T>(...args: Parameters<AxiosInstance['get']>): Promise<T> =>
    unwrap<T>(await instance.get<ApiResponse<T>>(...args)),
  patch: async <T>(...args: Parameters<AxiosInstance['patch']>): Promise<T> =>
    unwrap<T>(await instance.patch<ApiResponse<T>>(...args)),
  post: async <T>(...args: Parameters<AxiosInstance['post']>): Promise<T> =>
    unwrap<T>(await instance.post<ApiResponse<T>>(...args)),
  put: async <T>(...args: Parameters<AxiosInstance['put']>): Promise<T> =>
    unwrap<T>(await instance.put<ApiResponse<T>>(...args)),
  /** `{ data }`로 감싸지 않은 파일 응답을 Blob으로 받습니다. */
  getFile: async (...[url, config]: Parameters<AxiosInstance['get']>): Promise<FileResponse> => {
    const response = await instance.get<Blob>(url, { ...config, responseType: 'blob' });
    return {
      blob: response.data,
      filename: parseContentDispositionFilename(response.headers['content-disposition']),
    };
  },
});
