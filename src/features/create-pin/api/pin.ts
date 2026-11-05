import { useMutation, useQueryClient } from '@tanstack/react-query';

import { type PinCreateReqType, pinQueryKeys, postPin } from '@/entities/pin';
import { changeRequestQueryKeys, postChangeRequest } from '@/entities/request';
import type { ProjectRole } from '@/entities/user';

/**
 * 핀과 첫 댓글을 만들고, 고객이면 그 댓글로 수정 요청도 만듭니다.
 * 백엔드는 핀을 만들 때 수정 요청을 만들지 않고, 수정 요청은 고객만 만들 수 있습니다.
 *
 * 핀이 저장된 뒤 요청 생성만 실패하면 throw하지 않고 `requestFailed`로 알려 줍니다.
 * throw하면 사용자가 다시 시도할 때 핀이 하나 더 생기기 때문입니다.
 */
const createPinWithRequest = async (
  projectId: number,
  body: PinCreateReqType,
  role: ProjectRole,
) => {
  const pin = await postPin(projectId, body);
  if (role !== 'client') return { pin, requestFailed: false };

  try {
    await postChangeRequest(projectId, { source_pin_comment_id: pin.first_comment_id });
    return { pin, requestFailed: false };
  } catch {
    return { pin, requestFailed: true };
  }
};

export const usePostPin = (projectId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ role, ...body }: PinCreateReqType & { role: ProjectRole }) =>
      createPinWithRequest(projectId, body, role),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: pinQueryKeys.all(projectId) }),
        queryClient.invalidateQueries({ queryKey: changeRequestQueryKeys.all(projectId) }),
      ]),
  });
};
