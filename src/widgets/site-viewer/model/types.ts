import type { Pin } from '@/entities/pin';

// browse: 체험 모드(사이트를 평소처럼 사용), pin: 핀 모드(클릭한 위치에 핀 생성)
export type ViewerMode = 'browse' | 'pin';

export interface ViewerPin extends Pin {
  muted?: boolean;
  showBadge?: boolean;
}

export interface PinPosition {
  x: number;
  y: number;
}
