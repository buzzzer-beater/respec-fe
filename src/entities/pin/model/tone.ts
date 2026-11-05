import { type ChangeRequestStatus, isMyTurn } from '@/entities/request/@x/pin';
import type { ProjectRole } from '@/entities/user/@x/pin';

/** 핀 색. `brand` = 내 차례(보라), `quiet` = 상대 차례(연보라), `done` = 해결됨(회색) */
export const PIN_TONES = ['brand', 'quiet', 'done'] as const;

export type PinTone = (typeof PIN_TONES)[number];

export interface PinLook {
  tone: PinTone;
  /** 내가 움직일 차례라 빨간 점을 붙이는 핀 */
  alert: boolean;
}

/** 요청 상태와 내 역할로 핀 모양을 정합니다. 요청이 없는 핀은 상대 차례처럼 흐리게 둡니다. */
export function getPinLook(
  status: ChangeRequestStatus | null | undefined,
  role: ProjectRole | null | undefined,
): PinLook {
  if (status === 'resolved') return { tone: 'done', alert: false };
  if (status && isMyTurn(status, role)) return { tone: 'brand', alert: true };
  return { tone: 'quiet', alert: false };
}
