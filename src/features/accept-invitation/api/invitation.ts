import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  type InvitationAcceptance,
  invitationQueryKeys,
  projectQueryKeys,
} from '@/entities/project';
import { post } from '@/shared/api';

export interface InvitationAcceptReqType {
  token: string;
}

export const postInvitationAccept = (body: InvitationAcceptReqType) =>
  post<InvitationAcceptance>('/invitations/accept', body);

export const usePostInvitationAccept = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postInvitationAccept,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: projectQueryKeys.all() }),
        queryClient.invalidateQueries({ queryKey: invitationQueryKeys.all() }),
      ]),
  });
};
