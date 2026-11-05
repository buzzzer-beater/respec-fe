'use client';

import { useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import {
  getNotificationHref,
  NOTIFICATION_MESSAGE,
  type NotificationItem,
  useGetNotifications,
} from '@/entities/notification';
import { cn, formatRelativeTime } from '@/shared/lib';

import { usePatchNotificationRead } from '../api/notification';

/** 상단 바의 알림 버튼과 드롭다운 목록 */
const NotificationBell = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { data: notifications = [], isLoading, isError } = useGetNotifications();
  const { mutate: markRead } = usePatchNotificationRead();
  const unreadCount = notifications.filter(({ read_at }) => read_at === null).length;

  // 열려 있을 때 바깥 클릭이나 Esc로 닫습니다.
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsOpen(false);
      buttonRef.current?.focus();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // 읽음 처리 결과를 기다리지 않고 바로 이동합니다.
  const handleSelect = (notification: NotificationItem) => {
    setIsOpen(false);
    if (notification.read_at === null) markRead(notification.id);
    router.push(getNotificationHref(notification));
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={unreadCount > 0 ? `알림, 읽지 않은 알림 ${unreadCount}개` : '알림'}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="text-muted hover:text-ink hover:bg-hover aria-expanded:bg-hover aria-expanded:text-ink relative grid size-10 place-items-center rounded-full transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M6 9a6 6 0 1 1 12 0c0 4.5 2 6 2 6H4s2-1.5 2-6M10 19a2 2 0 0 0 4 0"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="bg-brand absolute top-0.5 right-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-white px-1 text-[10px] leading-none font-extrabold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="border-divider absolute top-full right-0 z-50 mt-2 flex max-h-[420px] w-80 flex-col overflow-hidden rounded-xl border bg-white shadow-lg">
          <h2 className="border-divider border-b px-4 py-3 text-sm font-extrabold">알림</h2>
          {isLoading || isError || notifications.length === 0 ? (
            <p className="text-muted px-4 py-10 text-center text-sm">
              {isError
                ? '알림을 불러오지 못했어요'
                : isLoading
                  ? '불러오는 중'
                  : '새 알림이 없어요'}
            </p>
          ) : (
            <ul className="overflow-y-auto">
              {notifications.map((notification) => {
                const isRead = notification.read_at !== null;

                return (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(notification)}
                      className={cn(
                        'hover:bg-hover flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors focus-visible:-outline-offset-2',
                        isRead && 'opacity-50',
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          'mt-1.5 size-1.5 shrink-0 rounded-full',
                          isRead ? 'bg-transparent' : 'bg-brand',
                        )}
                      />
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-ink text-sm font-bold">
                          {NOTIFICATION_MESSAGE[notification.type]}
                        </span>
                        <span className="text-muted text-xs">
                          {isRead && <span className="sr-only">읽음, </span>}
                          {formatRelativeTime(notification.created_at)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
