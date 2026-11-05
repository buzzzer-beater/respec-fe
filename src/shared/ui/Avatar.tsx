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

  if (!src) {
    return (
      <span
        aria-hidden
        className={cn('bg-line-subtle inline-block', classes)}
        style={{ width: size, height: size }}
      />
    );
  }

  return <Image src={src} alt={alt} width={size} height={size} unoptimized className={classes} />;
};

export default Avatar;
