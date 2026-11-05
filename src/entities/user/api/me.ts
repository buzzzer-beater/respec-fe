import { useQuery } from '@tanstack/react-query';

import { get } from '@/shared/api';

import type { User } from '../model/user';

export const userQueryKeys = {
  all: () => ['users'] as const,
  getMe: () => ['users', 'me'] as const,
} as const;

export const getMe = () => get<User>('/auth/me');

export const useGetMe = ({ enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({ queryKey: userQueryKeys.getMe(), queryFn: getMe, enabled });
