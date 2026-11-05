'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * 주소 쿼리의 켜기/끄기 값(`?chat=1`)을 읽고 바꿉니다. 상단 바와 화면처럼 떨어진 컴포넌트가 같은 상태를 씁니다.
 * 쓰는 곳은 `Suspense` 안에 있어야 합니다.
 */
export const useSearchFlag = (name: string) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isOn = searchParams.get(name) === '1';

  const set = (next: boolean) => {
    const params = new URLSearchParams(searchParams);
    if (next) params.set(name, '1');
    else params.delete(name);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return [isOn, set] as const;
};
