export interface TopBarLink {
  href: string;
  label: string;
  /** 0이면 숨기는 검정 숫자 (요청 관리의 내 차례 수) */
  badge?: number;
}
