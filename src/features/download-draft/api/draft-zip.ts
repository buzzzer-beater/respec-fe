import { useMutation, useQueryClient } from '@tanstack/react-query';

import { draftQueryKeys } from '@/entities/project';
import { getFile, isApiError } from '@/shared/api';
import { saveBlob } from '@/shared/lib';

// 압축은 서버에서 만들기 때문에 기본 10초보다 넉넉히 기다립니다.
const DRAFT_ZIP_TIMEOUT_MS = 30_000;

export const getProjectDraftZip = (projectId: number) =>
  getFile(`/projects/${projectId}/draft/zip`, { timeout: DRAFT_ZIP_TIMEOUT_MS });

/** 초안 코드를 ZIP으로 받아 저장합니다. 응답에 파일 이름이 없으면 `fallbackFilename`을 씁니다. */
export const useDownloadDraftZip = (projectId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fallbackFilename: string) => {
      const { blob, filename } = await getProjectDraftZip(projectId);
      saveBlob(blob, filename ?? fallbackFilename);
    },
    // 그사이 초안이 없어졌으면 초안 정보를 다시 받아 버튼을 숨깁니다.
    onError: (error) => {
      if (isApiError(error, 'DRAFT_NOT_FOUND')) {
        void queryClient.invalidateQueries({ queryKey: draftQueryKeys.getDraft(projectId) });
      }
    },
  });
};
