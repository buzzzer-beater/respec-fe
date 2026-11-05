import type { StaticImageData } from 'next/image';

/** 상태에 따라 색을 바꾸려고 SVG를 마스크로 씁니다. 색은 글자색(`currentColor`)을 따릅니다. */
const MaskIcon = ({ icon }: { icon: StaticImageData }) => (
  <span
    aria-hidden
    className="shrink-0 bg-current"
    style={{ width: icon.width, height: icon.height, maskImage: `url(${icon.src})` }}
  />
);

export default MaskIcon;
