'use client';

import { useEffect, useRef, useState } from 'react';

import Link from 'next/link';

import { useGetNotifications } from '@/entities/notification';
import { cn } from '@/shared/lib';
import { Icon } from '@/shared/ui';

import { usePatchNotificationRead, usePostNotificationsReadAll } from '../api/notification';
import { useNotificationRows } from '../model/use-notification-rows';

/** demo-design `.bell`: 상단 바의 알림 버튼과 목록 */
const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { data: notifications = [], isError } = useGetNotifications();
  const rows = useNotificationRows(notifications);
  const { mutate: markRead } = usePatchNotificationRead();
  const readAll = usePostNotificationsReadAll();
  const unread = notifications.filter(({ read_at }) => read_at === null);

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

  const markAllRead = () => readAll.mutate();

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={unread.length > 0 ? `알림, 읽지 않은 알림 ${unread.length}개` : '알림'}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="text-text hover:bg-hover aria-expanded:bg-hover ease-spring grid size-10 place-items-center rounded-[10px] transition-[transform,background-color] duration-300 active:scale-[0.88]"
      >
        <Icon name="bell" size={19} />
      </button>
      {unread.length > 0 && (
        <span
          aria-hidden
          className="bg-alert pointer-events-none absolute top-0.5 right-0 min-w-5 rounded-full px-1.5 py-px text-center text-[11px] font-extrabold text-white"
        >
          {unread.length > 99 ? '99+' : unread.length}
        </span>
      )}

      {isOpen && (
        <div
          role="dialog"
          aria-label="알림"
          className="absolute top-[calc(100%+8px)] right-0 z-[45] w-[360px] max-w-[calc(100vw-32px)] origin-top-right animate-[dd-in_0.22s_var(--ease-out-soft)] rounded-2xl bg-white p-2 shadow-[0_0_0_1px_var(--color-divider),0_16px_40px_rgba(24,24,27,0.16)]"
        >
          <div className="flex items-center justify-between px-3 pt-2.5 pb-2">
            <b className="text-base font-extrabold">알림</b>
            {unread.length > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                disabled={readAll.isPending}
                className="text-muted hover:text-ink text-xs font-semibold"
              >
                모두 읽음
              </button>
            )}
          </div>
          {rows.length === 0 ? (
            <p className="text-faint px-3 pt-7 pb-8 text-center text-[13px]">
              {isError ? '알림을 불러오지 못했어요' : '새 알림이 없어요'}
            </p>
          ) : (
            <ul className="grid max-h-[360px] gap-0.5 overflow-y-auto">
              {rows.map(({ notification, text, sub, href }) => {
                const isNew = notification.read_at === null;
                return (
                  <li key={notification.id}>
                    <Link
                      href={href}
                      onClick={() => {
                        setIsOpen(false);
                        if (isNew) markRead(notification.id);
                      }}
                      className="text-muted hover:bg-hover flex gap-2.5 rounded-[10px] p-3 focus-visible:-outline-offset-2"
                    >
                      <span
                        aria-hidden
                        className={cn(
                          'mt-[7px] size-[7px] shrink-0 rounded-full',
                          isNew && 'bg-alert',
                        )}
                      />
                      <span className="min-w-0">
                        <b
                          className={cn(
                            'block text-sm leading-[1.45]',
                            isNew ? 'text-ink font-bold' : 'text-text font-medium',
                          )}
                        >
                          {!isNew && <span className="sr-only">읽음, </span>}
                          {text}
                        </b>
                        <small className="text-xs">{sub}</small>
                      </span>
                    </Link>
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
