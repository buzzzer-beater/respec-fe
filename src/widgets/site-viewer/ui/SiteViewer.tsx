'use client';

import { type MouseEvent, type ReactNode, useState } from 'react';

import Image from 'next/image';

import { NumberedPin } from '@/entities/pin';

import arrowBackIcon from '../assets/arrow-back.svg';
import type { PinPosition, ViewerMode, ViewerPin } from '../model/types';
import BrowserFrame from './BrowserFrame';
import ViewerToolbar from './ViewerToolbar';

const ZOOM_STEP = 10;
const ZOOM_MIN = 50;
const ZOOM_MAX = 200;
const ZOOM_FIT = 100;

interface SiteViewerProps {
  url: string;
  pins: ViewerPin[];
  /** 없으면 "마지막 업데이트" 문구를 숨깁니다. */
  lastUpdatedLabel?: string;
  onPlacePin?: (position: PinPosition) => void;
  /** 저장 전인 새 핀 위치와, 그 옆에 띄울 입력창 */
  draftPin?: PinPosition | null;
  draftPinContent?: ReactNode;
  onSelectPin?: (pinId: string) => void;
  // 배포 사이트 미리보기 자리. 미리보기 방식이 정해지면 채웁니다.
  children?: ReactNode;
}

const SiteViewer = ({
  url,
  pins,
  lastUpdatedLabel,
  onPlacePin,
  onSelectPin,
  draftPin,
  draftPinContent,
  children,
}: SiteViewerProps) => {
  const [mode, setMode] = useState<ViewerMode>('pin');
  const [zoom, setZoom] = useState(ZOOM_FIT);

  const handlePlacePin = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onPlacePin?.({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <section className="relative flex h-full w-full flex-col items-center justify-center overflow-clip px-10 py-[17px]">
      <div className="flex w-full flex-col gap-2.5 pb-20">
        <div className="flex gap-2 px-2.5 py-2">
          <button type="button" aria-label="뒤로" className="rounded-full bg-white p-2">
            <Image src={arrowBackIcon} alt="" unoptimized />
          </button>
          <button type="button" aria-label="앞으로" className="rounded-full bg-white p-2">
            <Image src={arrowBackIcon} alt="" unoptimized className="-scale-x-100" />
          </button>
        </div>

        <div className="w-full origin-top" style={{ scale: zoom / 100 }}>
          <BrowserFrame url={url}>
            {children}
            {/* 핀 모드에서는 사이트 쪽 클릭이 동작하지 않도록 위를 덮습니다. */}
            {mode === 'pin' && (
              <button
                type="button"
                aria-label="핀 추가할 위치 선택"
                onClick={handlePlacePin}
                className="absolute inset-0 cursor-crosshair"
              />
            )}
            {pins.map((pin) => (
              <button
                key={pin.id}
                type="button"
                aria-label={`${pin.number}번 핀`}
                onClick={() => onSelectPin?.(pin.id)}
                className="absolute z-10 -translate-y-full"
                style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
              >
                <NumberedPin number={pin.number} muted={pin.muted} showBadge={pin.showBadge} />
              </button>
            ))}
            {draftPin && (
              <div
                className="absolute z-20 flex items-start gap-2"
                style={{ left: `${draftPin.x}%`, top: `${draftPin.y}%` }}
              >
                <span className="-translate-y-full">
                  <NumberedPin number={Math.max(0, ...pins.map((pin) => pin.number)) + 1} />
                </span>
                {draftPinContent}
              </div>
            )}
          </BrowserFrame>
        </div>

        {lastUpdatedLabel && (
          <p className="text-ink-450 self-end text-sm leading-[normal] whitespace-nowrap">
            마지막 업데이트 - {lastUpdatedLabel}
          </p>
        )}
      </div>

      <div className="absolute bottom-[31px] left-1/2 -translate-x-1/2">
        <ViewerToolbar
          mode={mode}
          onModeChange={setMode}
          zoom={zoom}
          onZoomIn={() => setZoom((value) => Math.min(value + ZOOM_STEP, ZOOM_MAX))}
          onZoomOut={() => setZoom((value) => Math.max(value - ZOOM_STEP, ZOOM_MIN))}
          onFit={() => setZoom(ZOOM_FIT)}
        />
      </div>
    </section>
  );
};

export default SiteViewer;
