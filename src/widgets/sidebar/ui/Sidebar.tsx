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

const NavList = ({ items }: { items: SidebarNavLink[] }) => (
  <ul className="flex w-full flex-col">
    {items.map((item) => (
      <li key={item.href}>
        <SidebarNavItem {...item} />
      </li>
    ))}
  </ul>
);

const Sidebar = ({ items, bottomItems = [], project }: SidebarProps) => {
  return (
    <aside className="flex h-full w-80 shrink-0 flex-col gap-14 overflow-clip px-7 pt-9 pb-3">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-start gap-3">
          <Image src={logoMark} alt="" unoptimized className="mt-[1.43px] shrink-0" />
          <span className="text-2xl leading-[normal] font-bold whitespace-nowrap text-black">
            RE:SPEC
          </span>
        </div>
        <button type="button" aria-label="사이드바 접기" className="shrink-0">
          <Image src={panelLeftCloseIcon} alt="" unoptimized />
        </button>
      </div>

      <nav className="flex w-full flex-col gap-9">
        <NavList items={items} />
        {bottomItems.length > 0 && (
          <>
            <Image src={dividerLine} alt="" unoptimized />
            <NavList items={bottomItems} />
          </>
        )}
      </nav>

      <div className="flex-1" />

      <div className="flex w-full flex-col">
        <Image src={dividerLine} alt="" unoptimized />
        <button type="button" className="flex w-full items-center gap-4 py-4 text-left">
          {project.imageUrl ? (
            <Image
              src={project.imageUrl}
              alt=""
              width={40}
              height={40}
              unoptimized
              className="rounded-xsmall size-10 shrink-0 object-cover"
            />
          ) : (
            <span className="rounded-xsmall bg-ink-500 size-10 shrink-0" />
          )}
          <span className="flex w-[111px] shrink-0 flex-col gap-0.5 leading-[normal]">
            <span className="text-ink-850 truncate font-medium">{project.name}</span>
            <span className="text-ink-300 truncate text-sm">{project.plan}</span>
          </span>
          <span className="flex-1" />
          <span className="flex shrink-0 items-center px-0.5">
            <Image src={arrowUpDownIcon} alt="" unoptimized />
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
