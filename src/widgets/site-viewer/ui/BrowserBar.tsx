'use client';

import { type Device, DeviceToggle } from '@/features/switch-device';

import expandIcon from '../assets/expand.svg';
import refreshIcon from '../assets/refresh.svg';
import type { SiteAddress } from '../model/types';
import MaskIcon from './MaskIcon';

const TOOL_BUTTON_CLASS =
  'text-text hover:bg-hover grid size-8 shrink-0 place-items-center rounded-lg disabled:opacity-40';

const AddressField = ({ host, path, pages, onSelectPage }: SiteAddress) => {
  const label = `${host}${path === '/' ? '' : path}`;
  if (!pages || !onSelectPage) {
    return (
      <p className="bg-stage text-text flex h-[30px] min-w-0 flex-1 items-center truncate rounded-lg px-3 text-[13px] font-medium sm:max-w-[420px]">
        {label}
      </p>
    );
  }

  // 지금 경로가 목록에 없을 수 있어서(핀이 없는 페이지) 맨 앞에 넣습니다.
  const options = pages.some((page) => page.path === path)
    ? pages
    : [{ path, pinCount: 0 }, ...pages];

  return (
    <label className="relative flex min-w-0 flex-1 sm:max-w-[420px]">
      <select
        aria-label="페이지"
        value={path}
        onChange={(event) => onSelectPage(event.target.value)}
        className="bg-stage text-text h-[30px] w-full min-w-0 cursor-pointer appearance-none truncate rounded-lg pr-7 pl-3 text-[13px] font-medium hover:bg-[#e8e8ec]"
      >
        {options.map((page) => (
          <option key={page.path} value={page.path}>
            {host}
            {page.path === '/' ? '' : page.path}
            {page.pinCount > 0 ? ` · 핀 ${page.pinCount}` : ''}
          </option>
        ))}
      </select>
      <span
        aria-hidden
        className="text-muted pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[10px]"
      >
        ▾
      </span>
    </label>
  );
};

interface BrowserBarProps {
  address?: SiteAddress;
  onReload?: () => void;
  device: Device;
  onDeviceChange: (device: Device) => void;
  isFull: boolean;
  onToggleFull: () => void;
  /** 주면 해결된 핀을 보이고 숨기는 "완료 보기" 토글을 둡니다. */
  showResolved?: boolean;
  onShowResolvedChange?: (value: boolean) => void;
}

/** 미리보기 틀 위쪽: 점 세 개 · 주소창 · 새로고침 · 화면 크기 · 완료 보기 · 전체 화면 */
const BrowserBar = ({
  address,
  onReload,
  device,
  onDeviceChange,
  isFull,
  onToggleFull,
  showResolved = false,
  onShowResolvedChange,
}: BrowserBarProps) => (
  <div className="border-divider flex h-12 shrink-0 items-center gap-2.5 border-b bg-white pr-2.5 pl-4">
    <span aria-hidden className="hidden gap-1.5 sm:flex">
      <i className="size-2.5 rounded-full bg-[#e4e4e9]" />
      <i className="size-2.5 rounded-full bg-[#e4e4e9]" />
      <i className="size-2.5 rounded-full bg-[#e4e4e9]" />
    </span>
    {address ? <AddressField {...address} /> : <span className="flex-1" />}

    <span className="ml-auto flex shrink-0 items-center gap-1.5">
      {onReload && (
        <button
          type="button"
          aria-label="새로고침"
          title="새로고침"
          onClick={onReload}
          className={TOOL_BUTTON_CLASS}
        >
          <MaskIcon icon={refreshIcon} />
        </button>
      )}
      {/* 좁은 화면에서는 화면이 이미 작아서 크기 선택을 숨깁니다. */}
      <span className="hidden lg:flex">
        <DeviceToggle value={device} onChange={onDeviceChange} />
      </span>
      {onShowResolvedChange && (
        <button
          type="button"
          onClick={() => onShowResolvedChange(!showResolved)}
          aria-pressed={showResolved}
          className="text-text hover:bg-hover aria-pressed:bg-brand-soft aria-pressed:text-brand h-8 rounded-lg px-2.5 text-[13px] font-semibold whitespace-nowrap"
        >
          완료 보기
        </button>
      )}
      <button
        type="button"
        aria-label={isFull ? '전체 화면 나가기 (Esc)' : '전체 화면 (F)'}
        title={isFull ? '전체 화면 나가기 · Esc' : '전체 화면 · F'}
        aria-pressed={isFull}
        onClick={onToggleFull}
        className={TOOL_BUTTON_CLASS}
      >
        <MaskIcon icon={expandIcon} />
      </button>
    </span>
  </div>
);

export default BrowserBar;
