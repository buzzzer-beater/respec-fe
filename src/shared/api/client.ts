import { createApiClient } from './factory';

export const axiosInstance = createApiClient({
  baseURL: '/backend',
  timeout: 10000,
});
