import { useMutation } from '@tanstack/react-query';

import type { ProjectInvitation } from '@/entities/project';
import { del, post } from '@/shared/api';

// 백엔드 body는 extra=forbid라서 빈 객체만 보냅니다.
export const postInvitation = (projectId: number) =>
  post<ProjectInvitation>(`/projects/${projectId}/invitations`, {});

export const deleteInvitation = (projectId: number) =>
  del<void>(`/projects/${projectId}/invitations`);

// 초대 링크는 조회 API가 없어서 무효화할 쿼리가 없습니다.
export const usePostInvitation = (projectId: number) =>
  useMutation({ mutationFn: () => postInvitation(projectId) });

export const useDeleteInvitation = (projectId: number) =>
  useMutation({ mutationFn: () => deleteInvitation(projectId) });
