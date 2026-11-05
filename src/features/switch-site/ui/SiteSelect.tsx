'use client';

import { cn } from '@/shared/lib';

import { useViewerSite } from '../model/use-viewer-site';

interface SiteSelectProps {
  hasDraft: boolean;
  hasDeployment: boolean;
  className?: string;
}

/**
 * 작업 화면에서 볼 사이트를 고릅니다. 배포 주소가 생겨도 초안을 다시 볼 수 있고,
 * 배포 전에는 배포본을 고를 수 없게 막고 "연결 전"으로 안내합니다.
 */
const SiteSelect = ({ hasDraft, hasDeployment, className }: SiteSelectProps) => {
  const { site, setSite } = useViewerSite({ hasDraft, hasDeployment });
  if (!site) return null;

  return (
    <label className={cn('relative inline-flex shrink-0', className)}>
      <select
        aria-label="보는 사이트"
        value={site}
        onChange={(event) => setSite(event.target.value === 'draft' ? 'draft' : 'deployed')}
        className="border-divider text-ink hover:bg-hover h-[30px] cursor-pointer appearance-none rounded-full border bg-white pr-7 pl-3 text-xs font-bold"
      >
        <option value="draft" disabled={!hasDraft}>
          {hasDraft ? '초안 · AI 생성' : '초안 · 없음'}
        </option>
        <option value="deployed" disabled={!hasDeployment}>
          {hasDeployment ? '배포본 · 개발자 배포' : '배포본 · 연결 전'}
        </option>
      </select>
      <span
        aria-hidden
        className="text-muted pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[10px]"
      >
        ▾
      </span>
    </label>
  );
};

export default SiteSelect;
