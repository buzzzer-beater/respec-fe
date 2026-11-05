import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { get, patch, post } from '@/shared/api';

import type { Project, ProjectMember } from '../model/project';

export const projectQueryKeys = {
  all: () => ['projects'] as const,
  getProjects: () => ['projects', 'list'] as const,
  getProject: (projectId: number) => ['projects', 'detail', projectId] as const,
  getProjectMembers: (projectId: number) => ['projects', 'detail', projectId, 'members'] as const,
} as const;

export const getProjects = () => get<Project[]>('/projects');

export const getProject = (projectId: number) => get<Project>(`/projects/${projectId}`);

export const getProjectMembers = (projectId: number) =>
  get<ProjectMember[]>(`/projects/${projectId}/members`);

export interface ProjectCreateReqType {
  name: string;
}

export const postProject = (body: ProjectCreateReqType) => post<Project>('/projects', body);

/** 고객만 바꿀 수 있습니다. 응답은 프로젝트 조회와 같습니다. */
export const patchProject = (projectId: number, body: ProjectCreateReqType) =>
  patch<Project>(`/projects/${projectId}`, body);

export const useGetProjects = () =>
  useQuery({ queryKey: projectQueryKeys.getProjects(), queryFn: getProjects });

export const useGetProject = (projectId: number) =>
  useQuery({
    queryKey: projectQueryKeys.getProject(projectId),
    queryFn: () => getProject(projectId),
  });

export const useGetProjectMembers = (projectId: number) =>
  useQuery({
    queryKey: projectQueryKeys.getProjectMembers(projectId),
    queryFn: () => getProjectMembers(projectId),
  });

/** 이름을 바꾸면 상단 바·목록이 새 이름을 쓰도록 프로젝트 쿼리를 모두 다시 받습니다. */
export const usePatchProject = (projectId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ProjectCreateReqType) => patchProject(projectId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectQueryKeys.all() }),
  });
};

export const usePostProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectQueryKeys.getProjects() }),
  });
};
