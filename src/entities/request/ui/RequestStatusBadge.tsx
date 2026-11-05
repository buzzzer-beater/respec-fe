interface RequestStatusBadgeProps {
  label: string;
}

// 상태 색은 따로 두지 않습니다. 메인 컬러를 핀에만 쓰려고 회색 한 가지로 표시합니다.
const RequestStatusBadge = ({ label }: RequestStatusBadgeProps) => {
  return (
    <span className="bg-hover text-text inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap">
      {label}
    </span>
  );
};

export default RequestStatusBadge;
