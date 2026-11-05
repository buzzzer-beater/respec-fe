'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/shared/lib';

import homeIcon from '../assets/home.svg';
import homeActiveIcon from '../assets/home-active.svg';
import type { SidebarNavLink } from '../model/types';

const SidebarNavItem = ({ href, label }: SidebarNavLink) => {
  const isActive = usePathname() === href;

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'rounded-small flex w-full items-center gap-2.5 px-4 py-3 text-lg leading-[normal]',
        isActive ? 'bg-primary-subtle text-ink-900 font-medium' : 'text-ink-700',
      )}
    >
      <Image src={isActive ? homeActiveIcon : homeIcon} alt="" unoptimized className="shrink-0" />
      <span className="whitespace-nowrap">{label}</span>
    </Link>
  );
};

export default SidebarNavItem;
