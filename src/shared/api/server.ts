import { API_BASE_URL } from '@/shared/config';

import { createApiClient } from './factory';

import 'server-only';

export const serverAxiosInstance = createApiClient({
  baseURL: API_BASE_URL,
  timeout: 10000,
});
