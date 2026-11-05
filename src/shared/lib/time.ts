const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** ISO 8601 시간을 "방금", "32분 전", "3일 전"처럼 바꿉니다. 값이 없거나 잘못되면 빈 문자열입니다. */
export function formatRelativeTime(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return '';
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return '';

  const seconds = Math.max(0, Math.floor((now - time) / 1000));
  if (seconds < MINUTE) return '방금';
  if (seconds < HOUR) return `${Math.floor(seconds / MINUTE)}분 전`;
  if (seconds < DAY) return `${Math.floor(seconds / HOUR)}시간 전`;
  return `${Math.floor(seconds / DAY)}일 전`;
}
