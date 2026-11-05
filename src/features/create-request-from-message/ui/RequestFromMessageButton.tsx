'use client';

import type { ChangeRequest } from '@/entities/request';
import { isApiError } from '@/shared/api';
import { toast } from '@/shared/ui';

import {
  getRequestFromMessageErrorMessage,
  usePostRequestFromMessage,
} from '../api/change-request';

interface RequestFromMessageButtonProps {
  projectId: number;
  messageId: number;
  /** 등록한 뒤(서랍을 닫고 그 요청 상세 열기 등) */
  onCreated?: (request: ChangeRequest) => void;
}

/**
 * 채팅 말풍선 아래 "요청으로 등록" (demo-design `.to-request`). 고객에게만 보여 주세요.
 * 핀 없이 등록하고, 말풍선에 마우스를 올렸을 때만 보입니다(터치 화면에서는 항상).
 * `MessageItem` 안(`group/bubble`)에 넣어야 올렸을 때 나타납니다.
 */
const RequestFromMessageButton = ({
  projectId,
  messageId,
  onCreated,
}: RequestFromMessageButtonProps) => {
  const postRequest = usePostRequestFromMessage(projectId);

  return (
    <button
      type="button"
      disabled={postRequest.isPending}
      onClick={() =>
        postRequest.mutate(
          { messageId },
          {
            onSuccess: (request) => {
              toast('채팅을 요청으로 등록했어요');
              onCreated?.(request);
            },
            onError: (error) =>
              toast(
                isApiError(error)
                  ? getRequestFromMessageErrorMessage(error)
                  : '요청으로 등록하지 못했어요.',
              ),
          },
        )
      }
      className="text-muted hover:text-ink mt-1.5 block text-xs font-semibold transition-opacity disabled:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/bubble:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100"
    >
      {postRequest.isPending ? '등록하는 중…' : '요청으로 등록'}
    </button>
  );
};

export default RequestFromMessageButton;
