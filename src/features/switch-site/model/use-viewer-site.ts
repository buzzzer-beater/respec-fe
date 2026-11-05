'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import {
  resolveViewerSite,
  VIEWER_SITE_PARAM,
  type ViewerSite,
  type ViewerSiteAvailability,
} from './site';

/** 주소 쿼리(`?site=`)로 작업 화면의 사이트를 읽고 바꿉니다. 쓰는 곳은 `Suspense` 안에 있어야 합니다. */
export const useViewerSite = (availability: ViewerSiteAvailability) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const site = resolveViewerSite(searchParams.get(VIEWER_SITE_PARAM), availability);

  const setSite = (next: ViewerSite) => {
    const params = new URLSearchParams(searchParams);
    params.set(VIEWER_SITE_PARAM, next);
    router.replace(`${pathname}?${params}`, { scroll: false });
  };

  return { site, setSite };
};
