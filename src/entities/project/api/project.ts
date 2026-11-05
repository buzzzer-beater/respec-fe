import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { get, post } from '@/shared/api';

import type { Project } from '../model/project';

export const projectQueryKeys = {
  all: () => ['projects'] as const,
  getProjects: () => ['projects', 'list'] as const,
  getProject: (projectId: number) => ['projects', 'detail', projectId] as const,
} as const;

export const getProjects = () => get<Project[]>('/projects');

export const getProject = (projectId: number) => get<Project>(`/projects/${projectId}`);

export interface ProjectCreateReqType {
  name: string;
}

export const postProject = (body: ProjectCreateReqType) => post<Project>('/projects', body);

export const useGetProjects = () =>
  useQuery({ queryKey: projectQueryKeys.getProjects(), queryFn: getProjects });

export const useGetProject = (projectId: number) =>
  useQuery({
    queryKey: projectQueryKeys.getProject(projectId),
    queryFn: () => getProject(projectId),
  });

export const usePostProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectQueryKeys.getProjects() }),
  });
};
