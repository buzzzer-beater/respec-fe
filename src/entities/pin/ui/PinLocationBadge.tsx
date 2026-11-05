import { PIN_LOCATION_STATUS_LABEL } from '../model/pin';

/** 재배포 후 요소를 못 찾은 핀에 붙입니다. 핀은 지우지 않고 위치를 다시 지정하게 합니다. */
const PinLocationBadge = () => (
  <span className="text-warn inline-flex items-center rounded-full bg-[#fff4e8] px-2.5 py-1 text-xs font-bold whitespace-nowrap">
    {PIN_LOCATION_STATUS_LABEL.needs_check}
  </span>
);

export default PinLocationBadge;
