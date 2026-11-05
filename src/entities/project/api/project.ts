import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { get, post } from '@/shared/api';

import type { Project, ProjectDraft, ProjectMember } from '../model/project';

export const projectQueryKeys = {
  all: () => ['projects'] as const,
  getProjects: () => ['projects', 'list'] as const,
  getProject: (projectId: number) => ['projects', 'detail', projectId] as const,
  getProjectMembers: (projectId: number) => ['projects', 'detail', projectId, 'members'] as const,
  getProjectDraft: (projectId: number) => ['projects', 'detail', projectId, 'draft'] as const,
} as const;

export const getProjects = () => get<Project[]>('/projects');

export const getProject = (projectId: number) => get<Project>(`/projects/${projectId}`);

export const getProjectMembers = (projectId: number) =>
  get<ProjectMember[]>(`/projects/${projectId}/members`);

/** 초안이 없으면 `DRAFT_NOT_FOUND`(404)로 실패합니다. */
export const getProjectDraft = (projectId: number) =>
  get<ProjectDraft>(`/projects/${projectId}/draft`);

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

export const useGetProjectMembers = (projectId: number) =>
  useQuery({
    queryKey: projectQueryKeys.getProjectMembers(projectId),
    queryFn: () => getProjectMembers(projectId),
  });

export const useGetProjectDraft = (projectId: number) =>
  useQuery({
    queryKey: projectQueryKeys.getProjectDraft(projectId),
    queryFn: () => getProjectDraft(projectId),
  });

export const usePostProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectQueryKeys.getProjects() }),
  });
};
