import Image from 'next/image';

import arrowUpDownIcon from '../assets/arrow-up-down.svg';
import dividerLine from '../assets/divider.svg';
import logoMark from '../assets/logo-mark.svg';
import panelLeftCloseIcon from '../assets/panel-left-close.svg';
import type { SidebarNavLink, SidebarProject } from '../model/types';
import SidebarNavItem from './SidebarNavItem';

interface SidebarProps {
  items: SidebarNavLink[];
  bottomItems?: SidebarNavLink[];
  project: SidebarProject;
}

const Sidebar = ({ items, bottomItems = [], project }: SidebarProps) => {
  return (
    <aside className="bg-surface-subtle flex h-full w-80 shrink-0 flex-col gap-14 px-7 py-9">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-start gap-[11.43px]">
          <Image src={logoMark} alt="" unoptimized className="mt-[1.43px] shrink-0" />
          <span className="text-[25.714px] leading-[normal] whitespace-nowrap text-black">
            RE:SPEC
          </span>
        </div>
        <button type="button" aria-label="사이드바 접기" className="shrink-0">
          <Image src={panelLeftCloseIcon} alt="" unoptimized />
        </button>
      </div>

      <nav className="flex w-full flex-col gap-9">
        <ul className="flex w-full flex-col">
          {items.map((item) => (
            <li key={item.href}>
              <SidebarNavItem {...item} />
            </li>
          ))}
        </ul>
        <Image src={dividerLine} alt="" unoptimized />
        <ul className="flex w-full flex-col">
          {bottomItems.map((item) => (
            <li key={item.href}>
              <SidebarNavItem {...item} />
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex-1" />

      <button type="button" className="flex w-full items-center gap-4 text-left">
        <span className="rounded-xsmall bg-ink-500 size-10 shrink-0" />
        <span className="flex w-[111px] shrink-0 flex-col gap-0.5 leading-[normal]">
          <span className="text-ink-850 truncate font-medium">{project.name}</span>
          <span className="text-ink-300 truncate text-sm">{project.plan}</span>
        </span>
        <span className="flex-1" />
        <span className="flex shrink-0 items-center px-0.5">
          <Image src={arrowUpDownIcon} alt="" unoptimized />
        </span>
      </button>
    </aside>
  );
};

export default Sidebar;
