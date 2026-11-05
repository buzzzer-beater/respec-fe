import { type Device, DeviceToggle } from '@/features/switch-device';

import type { WorkspaceParticipant } from '../model/types';
import ParticipantStack from './ParticipantStack';

interface WorkspaceHeaderProps {
  projectName: string;
  device: Device;
  onDeviceChange: (device: Device) => void;
  participants: WorkspaceParticipant[];
  onShare?: () => void;
}

const WorkspaceHeader = ({
  projectName,
  device,
  onDeviceChange,
  participants,
  onShare,
}: WorkspaceHeaderProps) => {
  return (
    <header className="border-line-strong flex h-16 w-full items-center gap-8 border-b bg-white px-7 py-3">
      <h1 className="text-ink-800 text-lg leading-[normal] font-medium whitespace-nowrap">
        {projectName}
      </h1>
      <div className="flex-1" />
      <DeviceToggle value={device} onChange={onDeviceChange} />
      <div className="flex shrink-0 items-center gap-[11px]">
        <ParticipantStack participants={participants} />
        <button
          type="button"
          onClick={onShare}
          className="bg-primary-strong rounded-xsmall px-3 py-2 text-sm leading-[normal] font-medium whitespace-nowrap text-white"
        >
          공유
        </button>
      </div>
    </header>
  );
};

export default WorkspaceHeader;
