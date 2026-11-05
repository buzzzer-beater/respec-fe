import Image from 'next/image';

import { Avatar } from '@/shared/ui';

import divider from '../assets/divider.svg';
import RequestStatusBadge from './RequestStatusBadge';

interface RequestCardProps {
  title: string;
  statusLabel: string;
  authorName: string;
  authorAvatarUrl?: string;
}

const RequestCard = ({ title, statusLabel, authorName, authorAvatarUrl }: RequestCardProps) => {
  return (
    <article className="rounded-small shadow-elevation-1 flex w-full flex-col items-start overflow-clip bg-white px-[18px] pt-4 pb-[17px] leading-[normal]">
      <span className="-ml-px">
        <RequestStatusBadge label={statusLabel} />
      </span>
      <h3 className="text-ink-800 mt-[11px] font-semibold">{title}</h3>
      <Image src={divider} alt="" unoptimized className="mt-[18px] -ml-1.5" />
      <div className="mt-[11px] flex items-center gap-2.5">
        <Avatar
          src={authorAvatarUrl}
          alt={authorName}
          size={20}
          className="ring-line-subtle ring-[0.5px]"
        />
        <span className="text-ink-600 text-xs whitespace-nowrap">{authorName}</span>
      </div>
    </article>
  );
};

export default RequestCard;
