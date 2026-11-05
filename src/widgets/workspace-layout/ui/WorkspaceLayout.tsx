'use client';

import { type ReactNode, useEffect, useState } from 'react';

import { cn } from '@/shared/lib';

interface WorkspaceLayoutProps {
  /** 사이트 뷰어 */
  children: ReactNode;
  /** 오른쪽 패널(요청/대화). 넓은 화면에서는 옆에, 좁은 화면에서는 전체 화면 시트로 보여 줍니다. */
  panel: ReactNode;
  /** 바뀌면 좁은 화면에서 시트를 엽니다. (뷰어에서 핀을 골랐을 때 등) */
  openKey?: unknown;
  /** 열기 버튼에 보여 줄 요청 수 */
  requestCount: number;
  /** 마지막 메시지 id. 불러오기 전에는 `undefined`, 메시지가 없으면 `0` */
  latestMessageId?: number;
}

/** 워크스페이스 배치: 데스크톱은 뷰어와 패널을 나란히, 모바일은 뷰어 중심에 패널은 시트로 */
const WorkspaceLayout = ({
  children,
  panel,
  openKey,
  requestCount,
  latestMessageId,
}: WorkspaceLayoutProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // 핀을 고르면 시트를 엽니다. 렌더 중에 이전 값과 비교해 한 번만 엽니다.
  const [prevOpenKey, setPrevOpenKey] = useState(openKey);
  if (openKey !== prevOpenKey) {
    setPrevOpenKey(openKey);
    if (openKey) setIsOpen(true);
  }

  // 시트가 열려 있을 때 본 메시지까지는 새 메시지로 치지 않습니다. 처음 불러온 메시지도 본 것으로 칩니다.
  const [seenMessageId, setSeenMessageId] = useState(latestMessageId);
  if (
    latestMessageId !== undefined &&
    latestMessageId !== seenMessageId &&
    (isOpen || seenMessageId === undefined)
  ) {
    setSeenMessageId(latestMessageId);
  }
  const hasNewMessage =
    latestMessageId !== undefined && seenMessageId !== undefined && latestMessageId > seenMessageId;

  // 주소에 `#pin-{id}`가 있으면(검수 화면에서 핀 보기 등) 해당 스레드가 보이도록 시트를 엽니다.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 주소는 마운트 후에만 읽을 수 있습니다.
    if (window.location.hash.startsWith('#pin-')) setIsOpen(true);
  }, []);

  // Esc로 시트를 닫습니다.
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col lg:flex-row">
      {children}

      {/* 좁은 화면에서만 보이는 패널 열기 막대 */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-controls="workspace-panel"
        aria-expanded={isOpen}
        className="border-divider text-ink flex h-14 shrink-0 items-center gap-4 border-t bg-white px-4 text-sm font-bold lg:hidden"
      >
        <span>
          요청 <span className="text-muted font-semibold">{requestCount}</span>
        </span>
        <span className="flex items-center gap-1.5">
          대화
          {hasNewMessage && (
            <>
              <span aria-hidden className="bg-brand size-2 rounded-full" />
              <span className="sr-only">새 메시지 있음</span>
            </>
          )}
        </span>
        <span className="text-muted ml-auto font-semibold">열기</span>
      </button>

      <div
        id="workspace-panel"
        className={cn(
          'flex h-full min-h-0 max-lg:[&>aside]:w-full',
          isOpen ? 'max-lg:fixed max-lg:inset-0 max-lg:z-40 max-lg:bg-white' : 'max-lg:hidden',
        )}
      >
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="패널 닫기"
          className="text-muted hover:text-ink hover:bg-hover absolute top-6 right-4 z-10 grid size-10 place-items-center rounded-full lg:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        {panel}
      </div>
    </div>
  );
};

export default WorkspaceLayout;
