import { useQuery } from '@tanstack/react-query';

import { get } from '@/shared/api';

import type { InvitationPreview } from '../model/invitation';

export const invitationQueryKeys = {
  all: () => ['invitations'] as const,
  getInvitationPreview: (token: string) => ['invitations', 'preview', token] as const,
} as const;

export const getInvitationPreview = (token: string) =>
  get<InvitationPreview>('/invitations/preview', { params: { token } });

/** 로그인 여부를 확인한 뒤에만 조회하도록 `enabled`를 받습니다. */
export const useGetInvitationPreview = (token: string, enabled = true) =>
  useQuery({
    queryKey: invitationQueryKeys.getInvitationPreview(token),
    queryFn: () => getInvitationPreview(token),
    enabled,
  });
