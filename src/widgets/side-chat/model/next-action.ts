import type { ChangeRequestStatus } from '@/entities/request';
import type { ProjectRole } from '@/entities/user';

const DEVELOPER_NEXT_ACTION: Partial<Record<ChangeRequestStatus, string>> = {
  open: '확인 시작',
  reviewing: '작업 시작',
  in_progress: '검수 요청에 담기',
};

/**
 * "지금 할 일" 카드 아래에 적을 다음 행동 (demo-design `renderFocus`).
 * 고객은 검수 대기일 때만 차례라 문구가 하나입니다. 내 차례가 아니면 `null`입니다.
 */
export const getNextActionLabel = (
  status: ChangeRequestStatus,
  role: ProjectRole | null | undefined,
): string | null => {
  if (role === 'developer') return DEVELOPER_NEXT_ACTION[status] ?? null;
  if (role === 'client' && status === 'pending_review') return '반영 위치를 보고 승인해 주세요';
  return null;
};
