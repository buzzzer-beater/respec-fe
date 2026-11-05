import { useMutation, useQueryClient } from '@tanstack/react-query';

import { type ProjectDeployment, projectQueryKeys } from '@/entities/project';
import { put } from '@/shared/api';

export interface DeploymentConnectReqType {
  /** https만, 계정 정보(`user:pass@`) 없는 URL */
  deployment_url: string;
}

export const putProjectDeployment = (projectId: number, body: DeploymentConnectReqType) =>
  put<ProjectDeployment>(`/projects/${projectId}/deployment`, body);

export const usePutProjectDeployment = (projectId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: DeploymentConnectReqType) => putProjectDeployment(projectId, body),
    // 목록과 상세 모두 배포 URL을 보여 주므로 프로젝트 쿼리 전체를 새로 받습니다.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectQueryKeys.all() }),
  });
};
