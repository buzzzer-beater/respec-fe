/** 다이얼로그를 닫으려는 방법 */
export type DialogCloseTrigger = 'escape' | 'backdrop' | 'button';

export interface DialogClosePolicy {
  /** 바깥(backdrop)을 눌러 닫을지. 기본 true */
  closeOnBackdropClick?: boolean;
  /** 제출 중처럼 닫으면 안 될 때 true. Esc·바깥 클릭·닫기 버튼을 모두 막습니다. */
  preventClose?: boolean;
}

export const shouldCloseDialog = (
  trigger: DialogCloseTrigger,
  { closeOnBackdropClick = true, preventClose = false }: DialogClosePolicy,
) => {
  if (preventClose) return false;
  if (trigger === 'backdrop') return closeOnBackdropClick;
  return true;
};

/**
 * 다이얼로그 자신에서 생긴 이벤트인지.
 * React 이벤트는 컴포넌트 트리를 따라 올라오므로, 안쪽 다이얼로그의 이벤트를 바깥 다이얼로그가 처리하지 않게 거릅니다.
 * 바깥 클릭도 같은 조건입니다. 내용 영역을 누르면 target이 안쪽 요소가 됩니다.
 */
export const isOwnDialogEvent = (event: { target: unknown; currentTarget: unknown }) =>
  event.target === event.currentTarget;
