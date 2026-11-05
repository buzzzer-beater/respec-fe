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
  /** 제목 바로 오른쪽(작업 화면의 사이트 선택 등) */
  titleAddon?: ReactNode;
  /** 오른쪽 끝 (참여자, 공유 버튼 등) */
  children?: ReactNode;
}

const TopBar = ({ title, links = [], titleAddon, children }: TopBarProps) => {
  const pathname = usePathname();

  return (
    // 좁은 화면에서는 링크 줄을 아래로 내리고, 제목이 너무 좁아지면 오른쪽 버튼을 다음 줄로 보냅니다.
    <header className="border-divider flex w-full shrink-0 flex-wrap items-center gap-x-2.5 gap-y-1 border-b bg-white px-4 py-2 lg:h-[84px] lg:flex-nowrap lg:px-10 lg:py-0">
      <Link
        href="/"
        className="border-divider flex items-center gap-2.5 border-r pr-3 text-[21px] font-black tracking-[-0.02em] whitespace-nowrap lg:pr-[22px]"
      >
        <Image src={logoMark} alt="" unoptimized className="size-[30px]" />
        <span className="max-sm:sr-only">RE:SPEC</span>
      </Link>
      {pathname !== '/login' && pathname !== '/signup' && (
        <Link
          href="/projects"
          aria-current={pathname === '/projects' ? 'page' : undefined}
          className="text-muted hover:text-ink aria-[current=page]:text-ink ml-1 text-sm font-bold whitespace-nowrap transition-colors lg:ml-3 lg:text-[15px]"
        >
          내 프로젝트
        </Link>
      )}
      {title && (
        <h1 className="ml-1 min-w-20 flex-1 truncate text-base font-extrabold tracking-[-0.01em] lg:ml-3 lg:min-w-0 lg:flex-initial lg:text-xl">
          {title}
        </h1>
      )}
      {titleAddon}

      <nav className="order-last -mb-2 flex h-11 w-full gap-5 overflow-x-auto max-lg:empty:hidden lg:order-none lg:mx-auto lg:mb-0 lg:h-auto lg:w-auto lg:gap-7 lg:self-stretch lg:overflow-visible">
        {links.map(({ href, label }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className="text-muted hover:text-ink aria-[current=page]:text-ink relative flex shrink-0 items-center text-[15px] font-bold whitespace-nowrap transition-colors aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-0 aria-[current=page]:after:bottom-0 aria-[current=page]:after:h-0.5 aria-[current=page]:after:bg-current lg:aria-[current=page]:after:-bottom-px"
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0 lg:gap-3">
        {children}
        <NotificationBell />
        <LogoutButton />
      </div>
    </header>
  );
};

export default TopBar;
