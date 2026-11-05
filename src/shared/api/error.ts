import { isAxiosError } from 'axios';

/** 백엔드 `app/common/error.py`의 ErrorCode */
export type BackendErrorCode =
  | 'INTERNAL_ERROR'
  | 'EMAIL_ALREADY_REGISTERED'
  | 'TASK_NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'HTTP_ERROR'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INVITATION_INVALID'
  | 'INVITATION_EXPIRED'
  | 'DRAFT_NOT_FOUND'
  | 'DRAFT_GENERATION_FAILED'
  | 'AI_UNAVAILABLE';

/** 응답을 받지 못했거나 형식을 알 수 없을 때는 프론트에서 정한 코드를 씁니다. */
export type ApiErrorCode = BackendErrorCode | 'NETWORK_ERROR' | 'TIMEOUT' | 'UNKNOWN_ERROR';

interface ApiErrorBody {
  error: { code: BackendErrorCode; message: string };
  requestId: string;
}

interface ApiErrorInit {
  code: ApiErrorCode;
  /** 응답을 받지 못하면 0 */
  status: number;
  message: string;
  requestId?: string;
}

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly requestId?: string;

  constructor({ code, status, message, requestId }: ApiErrorInit) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }
}

const isApiErrorBody = (value: unknown): value is ApiErrorBody => {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false;
  const { error } = value;
  return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
};

export const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) return error;

  if (!isAxiosError(error)) {
    return new ApiError({
      code: 'UNKNOWN_ERROR',
      status: 0,
      message: '알 수 없는 오류가 발생했습니다.',
    });
  }

  const { response } = error;

  if (!response) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError({ code: 'TIMEOUT', status: 0, message: '요청 시간이 초과되었습니다.' });
    }
    return new ApiError({
      code: 'NETWORK_ERROR',
      status: 0,
      message: '서버에 연결할 수 없습니다.',
    });
  }

  if (isApiErrorBody(response.data)) {
    return new ApiError({
      code: response.data.error.code,
      status: response.status,
      message: response.data.error.message,
      requestId: response.data.requestId,
    });
  }

  return new ApiError({
    code: 'UNKNOWN_ERROR',
    status: response.status,
    message: '알 수 없는 오류가 발생했습니다.',
  });
};

export const isApiError = (error: unknown, code?: ApiErrorCode): error is ApiError =>
  error instanceof ApiError && (code === undefined || error.code === code);
