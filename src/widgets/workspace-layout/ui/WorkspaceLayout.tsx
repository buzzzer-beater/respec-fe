'use client';

import { type ReactNode, useEffect, useState } from 'react';

import { cn } from '@/shared/lib';
import { Icon } from '@/shared/ui';

interface WorkspaceLayoutProps {
  /** 사이트 뷰어 */
  children: ReactNode;
  /** 오른쪽 패널. 넓은 화면에서는 옆에, 좁은 화면에서는 전체 화면 시트로 보여 줍니다. */
  panel: ReactNode;
  /**
   * 요청 상세와 검수 요청은 패널을 넓힙니다(420 → 560px, 1360px 이하 380 → 480px).
   * 패널과 같은 기준(`isWidePanelView(getPanelView(...))`)으로 넘겨 주세요.
   */
  isPanelWide?: boolean;
  /** 바뀌면 좁은 화면에서 시트를 엽니다. (뷰어에서 핀을 골랐을 때 등) */
  openKey?: unknown;
  /** 열기 버튼에 보여 줄 요청 수 */
  requestCount: number;
}

/**
 * 워크스페이스 배치: 데스크톱은 뷰어와 패널을 두 칸 격자로 나란히 두고, 패널 폭이 바뀌면 칸 너비를 부드럽게 바꿉니다.
 * 모바일은 뷰어 중심에 패널은 시트로 엽니다.
 */
const WorkspaceLayout = ({
  children,
  panel,
  isPanelWide = false,
  openKey,
  requestCount,
}: WorkspaceLayoutProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // 핀을 고르면 시트를 엽니다. 렌더 중에 이전 값과 비교해 한 번만 엽니다.
  const [prevOpenKey, setPrevOpenKey] = useState(openKey);
  if (openKey !== prevOpenKey) {
    setPrevOpenKey(openKey);
    if (openKey) setIsOpen(true);
  }

  // 주소에 `#pin-{id}`가 있으면(검수 화면에서 핀 보기 등) 해당 요청이 보이도록 시트를 엽니다.
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
    <div
      className={cn(
        'flex h-full min-w-0 flex-1 flex-col',
        'lg:ease-out-soft lg:grid lg:grid-rows-[minmax(0,1fr)] lg:transition-[grid-template-columns] lg:duration-400',
        isPanelWide
          ? 'lg:grid-cols-[minmax(0,1fr)_560px] lg:max-[1360px]:grid-cols-[minmax(0,1fr)_480px]'
          : 'lg:grid-cols-[minmax(0,1fr)_420px] lg:max-[1360px]:grid-cols-[minmax(0,1fr)_380px]',
      )}
    >
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
        <span className="text-muted ml-auto font-semibold">열기</span>
      </button>

      <div
        id="workspace-panel"
        className={cn(
          'flex h-full min-h-0 min-w-0',
          isOpen ? 'max-lg:fixed max-lg:inset-0 max-lg:z-40 max-lg:bg-white' : 'max-lg:hidden',
        )}
      >
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="패널 닫기"
          className="text-muted hover:text-ink hover:bg-hover absolute top-6 right-4 z-10 grid size-10 place-items-center rounded-full lg:hidden"
        >
          <Icon name="x" size={20} />
        </button>
        {panel}
      </div>
    </div>
  );
};

export default WorkspaceLayout;
