'use client';

import { useEffect, useRef, useState } from 'react';

import { PinMarkerButton } from '@/entities/pin';

import { getMarkerOffsets } from '../model/spread';
import type { ViewerPin } from '../model/types';

export interface MarkerPlacement {
  pin: ViewerPin;
  /** 레이어 안 위치(%) */
  x: number;
  y: number;
}

interface PinMarkerLayerProps {
  markers: MarkerPlacement[];
  selectedPinId?: string | null;
  onSelectPin?: (pinId: string) => void;
}

/**
 * 사이트 영역을 덮는 핀 마커 레이어. 레이어 자체는 클릭을 통과시키고 마커만 누를 수 있습니다.
 * 겹치는 핀은 레이어 크기(px)로 거리를 재서 표시 위치만 옮깁니다.
 */
const PinMarkerLayer = ({ markers, selectedPinId, onSelectPin }: PinMarkerLayerProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(() =>
      setSize({ width: element.clientWidth, height: element.clientHeight }),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // 크기를 재기 전에는 옮기지 않습니다.
  const offsets = size
    ? getMarkerOffsets(
        markers.map(({ x, y }) => ({ x: (x / 100) * size.width, y: (y / 100) * size.height })),
      )
    : [];

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0">
      {markers.map(({ pin, x, y }, index) => (
        <PinMarkerButton
          key={pin.id}
          number={pin.number}
          status={pin.status}
          muted={pin.muted}
          preview={pin.preview}
          selected={pin.id === selectedPinId}
          onClick={() => onSelectPin?.(pin.id)}
          className="pointer-events-auto"
          style={{ left: `calc(${x}% + ${offsets[index] ?? 0}px)`, top: `${y}%` }}
        />
      ))}
    </div>
  );
};

export default PinMarkerLayer;
