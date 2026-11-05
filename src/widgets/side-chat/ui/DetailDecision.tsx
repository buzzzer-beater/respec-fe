'use client';

import {
  CHANGE_REQUEST_STATUS_LABEL,
  type ChangeRequestStatus,
  getTransitionErrorMessage,
} from '@/entities/request';
import type { ProjectRole } from '@/entities/user';
import {
  type DeveloperTransition,
  useChangeRequestTransition,
} from '@/features/change-request-status';
import { ResolveDecision } from '@/features/resolve-request';
import { isApiError } from '@/shared/api';
import { Button, toast } from '@/shared/ui';

interface DetailDecisionProps {
  projectId: number;
  requestId: number;
  pinNumber: number | null;
  status: ChangeRequestStatus;
  role: ProjectRole | undefined;
  /** 고객이 배포본에서 반영 위치를 아직 안 봤으면 결정 전에 확인 안내를 붙입니다. */
  showLocationHint: boolean;
  /** 개발자 "검수 요청에 담기": 검수 요청 화면을 이 요청을 골라 둔 채로 엽니다. */
  onAddToReview: (requestId: number) => void;
}

const DEVELOPER_STEP: Partial<
  Record<ChangeRequestStatus, { transition: DeveloperTransition; label: string }>
> = {
  open: { transition: 'acknowledge', label: '확인 시작' },
  reviewing: { transition: 'start', label: '작업 시작' },
};

const Hint = ({ children }: { children: string }) => (
  <p className="text-muted text-[13px]">{children}</p>
);

/**
 * 요청 상세 아래 결정 영역 (demo-design `renderActions`). 버튼은 48px이고 검정은 하나만 둡니다.
 * 개발자: 확인 시작 → 작업 시작 → 검수 요청에 담기 → (고객 검수 중 안내)
 * 고객: 검수 대기일 때만 재수정 요청 / 승인하기, 그 전에는 안내만
 */
const DetailDecision = ({
  projectId,
  requestId,
  pinNumber,
  status,
  role,
  showLocationHint,
  onAddToReview,
}: DetailDecisionProps) => {
  const transition = useChangeRequestTransition(projectId);

  if (status === 'resolved' || !role) return null;

  if (role === 'client') {
    if (status !== 'pending_review') {
      return <Hint>개발자가 작업하고 있어요. 궁금한 점은 답글로 남겨 주세요.</Hint>;
    }
    return (
      <ResolveDecision
        projectId={projectId}
        requestId={requestId}
        pinNumber={pinNumber}
        showLocationHint={showLocationHint}
      />
    );
  }

  if (status === 'pending_review') return <Hint>고객이 검수하고 있어요.</Hint>;

  if (status === 'in_progress') {
    return (
      <Button size="lg" onClick={() => onAddToReview(requestId)} className="w-full">
        검수 요청에 담기
      </Button>
    );
  }

  const step = DEVELOPER_STEP[status];
  if (!step) return null;
  return (
    <Button
      size="lg"
      disabled={transition.isPending}
      className="w-full"
      onClick={() =>
        transition.mutate(
          { requestId, transition: step.transition },
          {
            onSuccess: ({ status: next }) =>
              toast(
                `${pinNumber === null ? '요청' : `핀 ${pinNumber}`} · ${CHANGE_REQUEST_STATUS_LABEL[next]}`,
              ),
            onError: (error) =>
              toast(isApiError(error) ? getTransitionErrorMessage(error) : '바꾸지 못했어요.'),
          },
        )
      }
    >
      {step.label}
    </Button>
  );
};

export default DetailDecision;
