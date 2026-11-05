import Image from 'next/image';

import { cn } from '@/shared/lib';

interface AvatarProps {
  src?: string;
  alt?: string;
  size: number;
  className?: string;
}

const Avatar = ({ src, alt = '', size, className }: AvatarProps) => {
  const classes = cn('shrink-0 rounded-full object-cover', className);

  // 사진이 없으면 이름 첫 글자를 보여 줍니다. 바탕색은 className으로 바꿀 수 있습니다.
  if (!src) {
    return (
      <span
        aria-hidden
        className={cn(
          'bg-faint grid place-items-center text-[11px] font-bold text-white uppercase',
          classes,
        )}
        style={{ width: size, height: size }}
      >
        {alt.trim().charAt(0)}
      </span>
    );
  }

  return <Image src={src} alt={alt} width={size} height={size} unoptimized className={classes} />;
};

export default Avatar;
