import Image from 'next/image';

import { Avatar } from '@/shared/ui';

import chevronIcon from '../assets/chevron.svg';
import type { WorkspaceParticipant } from '../model/types';

interface ParticipantStackProps {
  participants: WorkspaceParticipant[];
}

const ParticipantStack = ({ participants }: ParticipantStackProps) => {
  return (
    <div className="flex items-center pl-0.5">
      {participants.map(({ id, name, avatarUrl }, index) => (
        <span
          key={id}
          className="relative -ml-4 first:ml-0"
          style={{ zIndex: participants.length - index + 1 }}
        >
          <Avatar src={avatarUrl} alt={name} size={40} className="border-2 border-white" />
        </span>
      ))}
      <button
        type="button"
        aria-label="참여자 목록"
        className="bg-surface-muted relative -ml-[3px] flex size-8 items-center justify-center rounded-full"
      >
        <Image src={chevronIcon} alt="" unoptimized className="-rotate-90" />
      </button>
    </div>
  );
};

export default ParticipantStack;
