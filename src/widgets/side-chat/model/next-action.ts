import type { ChangeRequestStatus } from '@/entities/request';
import type { ProjectRole } from '@/entities/user';

const NEXT_ACTION_LABEL: Record<ProjectRole, Partial<Record<ChangeRequestStatus, string>>> = {
  developer: {
    open: '확인 시작',
    reviewing: '작업 시작',
    in_progress: '검수 요청에 담기',
  },
  client: {
    pending_review: '반영 내용을 보고 승인해 주세요',
  },
};

/** "지금 할 일" 카드 아래에 적을 다음 행동. 내 차례가 아니면 `null`입니다. */
export const getNextActionLabel = (
  status: ChangeRequestStatus,
  role: ProjectRole | null | undefined,
): string | null => (role ? (NEXT_ACTION_LABEL[role][status] ?? null) : null);
