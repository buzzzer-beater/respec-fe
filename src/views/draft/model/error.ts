import type { ApiError } from '@/shared/api';

/** 초안 생성 오류를 다시 시도 안내 문구로 바꿉니다. */
export const toDraftErrorMessage = (error: ApiError) => {
  if (error.code === 'DRAFT_GENERATION_FAILED')
    return '초안을 만들지 못했어요. 다시 시도해 주세요.';
  if (error.code === 'AI_UNAVAILABLE')
    return '지금은 AI를 사용할 수 없어요. 잠시 후 다시 시도해 주세요.';
  if (error.code === 'FORBIDDEN') return '초안은 고객만 만들 수 있어요.';
  if (error.code === 'TIMEOUT' || error.status === 502 || error.status === 504) {
    return '초안 생성 시간이 너무 오래 걸렸어요. 다시 시도해 주세요.';
  }
  return error.message;
};
