import { useQueries } from '@tanstack/react-query';

import { changeRequestQueryKeys, getChangeRequest } from '@/entities/request';
import type { ReviewItem } from '@/entities/review';
import { POLLING_INTERVAL_MS } from '@/shared/config';

/**
 * 요청들의 마지막 검수 항목(배포본 반영 위치, 반영 설명). 요청 id → 항목입니다.
 * 목록 API에는 없어서 상세를 요청마다 받습니다. 요청 상세 화면과 같은 쿼리라 캐시를 함께 씁니다.
 * 검수 대기(와 "완료 보기"를 켰을 때 해결됨) 요청만 넘기세요. 나머지는 반영 위치를 보여 줄 일이 없습니다.
 */
export const useGetLatestReviewItems = (projectId: number, requestIds: number[]) =>
  useQueries({
    queries: requestIds.map((requestId) => ({
      queryKey: changeRequestQueryKeys.getChangeRequest(projectId, requestId),
      queryFn: () => getChangeRequest(projectId, requestId),
      refetchInterval: POLLING_INTERVAL_MS,
    })),
    combine: (results) =>
      new Map(
        results.flatMap(({ data }) =>
          data?.latest_review_item ? [[data.id, data.latest_review_item] as const] : [],
        ),
      ) as Map<number, ReviewItem>,
  });
