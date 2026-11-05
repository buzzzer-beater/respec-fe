'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import type { ReactNode } from 'react';

import { LogoutButton } from '@/features/auth';
import { NotificationBell } from '@/features/read-notification';

import logoMark from '../assets/logo-mark.svg';
import type { TopBarLink } from '../model/types';

interface TopBarProps {
  /** 로고 오른쪽에 크게 보이는 제목. 보통 프로젝트 이름입니다. */
  title?: string;
  links?: TopBarLink[];
  /** 오른쪽 끝 (참여자, 공유 버튼 등) */
  children?: ReactNode;
}

const TopBar = ({ title, links = [], children }: TopBarProps) => {
  const pathname = usePathname();

  return (
    <header className="border-divider flex h-[84px] w-full shrink-0 items-center gap-2.5 border-b bg-white px-10">
      <Link
        href="/"
        className="border-divider flex items-center gap-2.5 border-r pr-[22px] text-[21px] font-black tracking-[-0.02em] whitespace-nowrap"
      >
        <Image src={logoMark} alt="" unoptimized className="size-[30px]" />
        RE:SPEC
      </Link>
      {title && (
        <h1 className="ml-3 truncate text-xl font-extrabold tracking-[-0.01em]">{title}</h1>
      )}

      <nav className="mx-auto flex gap-7 self-stretch">
        {links.map(({ href, label }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className="text-muted hover:text-ink aria-[current=page]:text-ink relative flex items-center text-[15px] font-bold transition-colors aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-0 aria-[current=page]:after:-bottom-px aria-[current=page]:after:h-0.5 aria-[current=page]:after:bg-current"
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="flex shrink-0 items-center gap-3">
        {children}
        <NotificationBell />
        <LogoutButton />
      </div>
    </header>
  );
};

export default TopBar;
