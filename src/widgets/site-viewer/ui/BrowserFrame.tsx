import Image from 'next/image';

import type { ReactNode } from 'react';

import windowDots from '../assets/window-dots.svg';

interface BrowserFrameProps {
  url: string;
  children?: ReactNode;
}

const BrowserFrame = ({ url, children }: BrowserFrameProps) => {
  return (
    <div className="flex w-full flex-col drop-shadow-[0px_3px_5px_rgba(0,0,0,0.02)]">
      <div className="border-line-frame bg-frame-bar rounded-t-xsmall flex h-9 w-full items-center gap-[29px] border pl-[18px]">
        <Image src={windowDots} alt="" unoptimized className="shrink-0" />
        <span className="bg-frame-url text-ink-550 w-[318px] truncate rounded-full px-3 py-1 text-xs leading-[normal]">
          {url}
        </span>
      </div>
      <div className="border-line-frame rounded-b-xsmall shadow-elevation-2 relative aspect-[1512/982] w-full overflow-clip border bg-white">
        {children}
      </div>
    </div>
  );
};

export default BrowserFrame;
