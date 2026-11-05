'use client';

import { type Device, DeviceToggle } from '@/features/switch-device';
import { cn } from '@/shared/lib';
import { Dropdown, Icon, IconButton, Switch } from '@/shared/ui';

import type { PinScriptStatus, SiteAddress } from '../model/types';

// demo-design `.url-select .dd-trigger`: 회색 바탕은 마우스를 올려도 그대로 두고 테두리만 보입니다.
const ADDRESS_CLASS =
  'bg-stage text-text h-[30px] w-full rounded-lg px-3 text-[13px] font-medium hover:bg-stage group-data-open/dd:bg-stage';

const CONNECTION: Record<PinScriptStatus, { className: string; label: string }> = {
  connecting: { className: 'bg-faint', label: '연결 확인 중' },
  connected: { className: 'bg-ok', label: '핀 스크립트 연결됨' },
  disconnected: { className: 'bg-pending', label: '핀 스크립트 없음' },
};

const toAddressLabel = (host: string, path: string) => `${host}${path === '/' ? '' : path}`;

const AddressField = ({ host, path, pages, onSelectPage }: SiteAddress) => {
  if (!pages || !onSelectPage) {
    return (
      <p className={cn(ADDRESS_CLASS, 'flex max-w-[420px] min-w-0 flex-1 items-center')}>
        <span className="truncate">{toAddressLabel(host, path)}</span>
      </p>
    );
  }

  // 지금 경로가 목록에 없을 수 있어서(핀이 없는 페이지) 맨 앞에 넣습니다.
  const options = (
    pages.some((page) => page.path === path) ? pages : [{ path, pinCount: 0 }, ...pages]
  ).map((page) => ({
    value: page.path,
    label: toAddressLabel(host, page.path),
    sub: page.pinCount > 0 ? `핀 ${page.pinCount}` : undefined,
  }));

  return (
    <Dropdown
      label="페이지"
      value={path}
      options={options}
      onChange={onSelectPage}
      className="max-w-[420px] min-w-0 flex-1"
      triggerClassName={ADDRESS_CLASS}
    />
  );
};

interface BrowserBarProps {
  address?: SiteAddress;
  /** 핀 스크립트 연결 상태. 주면 주소창 오른쪽에 작은 점으로 보여 줍니다. */
  scriptStatus?: PinScriptStatus;
  onReload?: () => void;
  device: Device;
  onDeviceChange: (device: Device) => void;
  isFull: boolean;
  onToggleFull: () => void;
  /** 주면 해결된 핀을 보이고 숨기는 "완료 보기" 스위치를 둡니다. */
  showResolved?: boolean;
  onShowResolvedChange?: (value: boolean) => void;
}

/** 미리보기 틀 위쪽: 점 세 개 · 주소창 · 연결 점 · 새로고침 · 화면 크기 · 완료 보기 · 전체 화면 */
const BrowserBar = ({
  address,
  scriptStatus,
  onReload,
  device,
  onDeviceChange,
  isFull,
  onToggleFull,
  showResolved = false,
  onShowResolvedChange,
}: BrowserBarProps) => {
  const connection = scriptStatus && CONNECTION[scriptStatus];

  return (
    <div className="border-divider flex h-12 shrink-0 items-center gap-2.5 border-b bg-white pr-2.5 pl-4">
      <span aria-hidden className="flex gap-1.5">
        <i className="bg-chip size-2.5 rounded-full" />
        <i className="bg-chip size-2.5 rounded-full" />
        <i className="bg-chip size-2.5 rounded-full" />
      </span>
      {address ? <AddressField {...address} /> : <span className="flex-1" />}
      {connection && (
        <span
          role="img"
          aria-label={connection.label}
          title={connection.label}
          className={cn(
            '-ml-0.5 size-2 shrink-0 rounded-full transition-colors',
            connection.className,
          )}
        />
      )}

      <span className="ml-auto flex shrink-0 items-center gap-1">
        {onReload && (
          <IconButton aria-label="새로고침" title="새로고침" onClick={onReload}>
            <Icon name="refresh" size={15} />
          </IconButton>
        )}
        <DeviceToggle value={device} onChange={onDeviceChange} variant="bar" />
        {onShowResolvedChange && (
          // 시안은 스위치가 글자 앞에 옵니다. 좁은 화면(≤1360px)에서는 글자를 숨깁니다.
          <Switch
            checked={showResolved}
            onCheckedChange={onShowResolvedChange}
            aria-label="완료 보기"
            title="완료 보기"
            className={cn(
              'hover:bg-hover h-8 flex-row-reverse rounded-[10px] px-2.5',
              !showResolved && 'text-text',
            )}
          >
            <span className="max-[1360px]:hidden">완료 보기</span>
          </Switch>
        )}
        <IconButton
          aria-label="전체 화면"
          title={isFull ? '전체 화면 나가기 (Esc)' : '전체 화면 (F)'}
          aria-pressed={isFull}
          onClick={onToggleFull}
        >
          <Icon name="fit" size={15} />
        </IconButton>
      </span>
    </div>
  );
};

export default BrowserBar;
