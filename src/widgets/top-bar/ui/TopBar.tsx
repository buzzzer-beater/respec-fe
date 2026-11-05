'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import type { ReactNode } from 'react';

import { type ProjectRole, RoleAvatar, useGetMe } from '@/entities/user';
import { LogoutButton, useHasAccessToken } from '@/features/auth';
import { NotificationBell } from '@/features/read-notification';

import logo from '../assets/respec-logo.png';
import type { TopBarLink } from '../model/types';

interface TopBarProps {
  /** 로고 오른쪽 제목(`.crumb`). 프로젝트 이름이나 화면 이름입니다. */
  title?: string;
  links?: TopBarLink[];
  /** 제목 바로 오른쪽(작업 화면의 사이트 선택 등) */
  titleAddon?: ReactNode;
  /** 오른쪽 (배포 주소, 참여자, 초대 등). 알림과 내 아바타 앞에 붙습니다. */
  children?: ReactNode;
  /** 내 아바타 색. 프로젝트 안에서는 내 역할, 밖에서는 모르므로 `null` */
  myRole?: ProjectRole | null;
  /** 초대 화면처럼 로고와 제목만 보일 때 */
  minimal?: boolean;
}

/** demo-design `.topbar`: 로고 · 제목 · 화면 전환 · 오른쪽 버튼 · 알림 · 내 아바타 */
const TopBar = ({
  title,
  links = [],
  titleAddon,
  children,
  myRole = null,
  minimal,
}: TopBarProps) => {
  const pathname = usePathname();
  const hasToken = useHasAccessToken();
  const { data: me } = useGetMe({ enabled: hasToken === true && !minimal });

  return (
    // 좁은 화면에서는 링크 줄을 아래로 내리고, 제목이 너무 좁아지면 오른쪽 버튼을 다음 줄로 보냅니다.
    <header className="border-divider flex w-full shrink-0 flex-wrap items-center gap-x-2.5 gap-y-1 border-b bg-white px-4 py-2 lg:h-[84px] lg:flex-nowrap lg:px-10 lg:py-0">
      <Link
        href="/projects"
        aria-label="RE:SPEC 처음으로"
        className="border-divider flex items-center border-r pr-3 lg:pr-[22px]"
      >
        <Image
          src={logo}
          alt=""
          unoptimized
          priority
          className="block h-[34px] w-[154px] flex-none object-cover object-center"
        />
      </Link>
      {title && (
        <h1 className="ml-1 min-w-20 flex-1 truncate text-base font-extrabold tracking-[-0.01em] lg:ml-3 lg:min-w-0 lg:flex-initial lg:text-xl">
          {title}
        </h1>
      )}
      {titleAddon}

      <nav
        aria-label="화면"
        className="order-last -mb-2 flex h-11 w-full gap-5 overflow-x-auto max-lg:empty:hidden lg:order-none lg:mx-auto lg:mb-0 lg:h-auto lg:w-auto lg:gap-7 lg:self-stretch lg:overflow-visible"
      >
        {links.map(({ href, label, badge }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className="text-muted hover:text-ink aria-[current=page]:text-ink relative flex shrink-0 items-center gap-1.5 text-[15px] font-bold whitespace-nowrap transition-colors aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-0 aria-[current=page]:after:bottom-0 aria-[current=page]:after:h-0.5 aria-[current=page]:after:bg-current lg:aria-[current=page]:after:-bottom-px"
            >
              {label}
              {!!badge && (
                <span className="bg-ink min-w-5 rounded-full px-1.5 py-px text-center text-[11px] font-extrabold text-white">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {!minimal && (
        <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0">
          {children}
          {hasToken && <NotificationBell />}
          {me && (
            <span className="flex items-center gap-2 pl-1">
              <RoleAvatar name={me.email} role={myRole} size={36} />
            </span>
          )}
          {/* 시안에는 없지만 기존 로그아웃 버튼은 그대로 둡니다. */}
          <LogoutButton />
        </div>
      )}
    </header>
  );
};

export default TopBar;
