import Image from 'next/image';

import alertIcon from '../assets/alert.svg';

interface RequestStatusBadgeProps {
  label: string;
}

// 지금은 Figma에 있는 '미해결' 스타일만 있습니다. 다른 상태 색은 디자인과 백엔드 enum이 정해지면 추가합니다.
const RequestStatusBadge = ({ label }: RequestStatusBadgeProps) => {
  return (
    <span className="bg-surface-subtle inline-flex items-center justify-center gap-1 rounded-xs px-1.5 py-1">
      <Image src={alertIcon} alt="" unoptimized />
      <span className="text-danger text-xs leading-[normal] font-medium whitespace-nowrap">
        {label}
      </span>
    </span>
  );
};

export default RequestStatusBadge;
