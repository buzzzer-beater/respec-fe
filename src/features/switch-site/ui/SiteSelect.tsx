'use client';

import { PIN_SOURCE_LABEL } from '@/entities/pin';
import { Dropdown, toast } from '@/shared/ui';

import {
  DEPLOYMENT_NOT_CONNECTED_MESSAGE,
  VIEWER_SITE_PIN_SOURCE,
  VIEWER_SITE_SWITCH_MESSAGE,
  type ViewerSite,
} from '../model/site';
import { useViewerSite } from '../model/use-viewer-site';

interface SiteSelectProps {
  hasDraft: boolean;
  hasDeployment: boolean;
  /**
   * 아직 볼 수 없는 사이트(배포 전의 배포본 B 등)를 골랐을 때. 고른 사이트는 바뀌지 않습니다.
   * 개발자는 배포 연결 대화상자를 열고, 고객은 안내를 띄우는 식으로 부모가 정합니다.
   * 없으면 "아직 개발자가 배포 주소를 연결하지 않았어요"를 띄웁니다.
   */
  onSelectUnavailable?: (site: ViewerSite) => void;
  className?: string;
}

/**
 * 작업 화면에서 볼 사이트를 고릅니다(초안 A · 배포본 B). 배포 주소가 생겨도 초안을 다시 볼 수 있고,
 * 배포 전에도 배포본을 고를 수 있게 두되 "연결 전"으로 보여 주고 `onSelectUnavailable`로 넘깁니다.
 */
const SiteSelect = ({
  hasDraft,
  hasDeployment,
  onSelectUnavailable,
  className,
}: SiteSelectProps) => {
  const { site, setSite } = useViewerSite({ hasDraft, hasDeployment });
  if (!site) return null;

  const options = [
    { value: 'draft', label: PIN_SOURCE_LABEL[VIEWER_SITE_PIN_SOURCE.draft], sub: 'AI 생성' },
    {
      value: 'deployed',
      label: PIN_SOURCE_LABEL[VIEWER_SITE_PIN_SOURCE.deployed],
      sub: hasDeployment ? '개발자 배포' : '연결 전',
    },
  ] as const;

  const handleChange = (next: ViewerSite) => {
    const isAvailable = next === 'draft' ? hasDraft : hasDeployment;
    if (!isAvailable) {
      if (onSelectUnavailable) onSelectUnavailable(next);
      else toast(DEPLOYMENT_NOT_CONNECTED_MESSAGE);
      return;
    }
    setSite(next);
    toast(VIEWER_SITE_SWITCH_MESSAGE[next]);
  };

  return (
    <Dropdown
      label="보는 사이트"
      value={site}
      options={options}
      onChange={handleChange}
      className={className}
    />
  );
};

export default SiteSelect;
