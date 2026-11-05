import { cn } from '@/shared/lib';
import { Avatar } from '@/shared/ui';

interface PinMarkerProps {
  authorName?: string;
  authorAvatarUrl?: string;
  className?: string;
}

// 왼쪽 아래 뾰족한 모서리가 핀이 가리키는 지점입니다.
const PinMarker = ({ authorName, authorAvatarUrl, className }: PinMarkerProps) => {
  return (
    <span
      className={cn(
        'bg-brand inline-flex w-fit shrink-0 rounded-full rounded-bl-none p-1.5',
        className,
      )}
    >
      <Avatar src={authorAvatarUrl} alt={authorName} size={40} />
    </span>
  );
};

export default PinMarker;
