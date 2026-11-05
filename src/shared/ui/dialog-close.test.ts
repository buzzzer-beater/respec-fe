import { describe, expect, it } from 'vitest';

import { isOwnDialogEvent, shouldCloseDialog } from './dialog-close';

describe('shouldCloseDialog', () => {
  it('기본값이면 Esc, 바깥 클릭, 닫기 버튼 모두 닫는다', () => {
    expect(shouldCloseDialog('escape', {})).toBe(true);
    expect(shouldCloseDialog('backdrop', {})).toBe(true);
    expect(shouldCloseDialog('button', {})).toBe(true);
  });

  it('closeOnBackdropClick이 false면 바깥 클릭만 막는다', () => {
    const policy = { closeOnBackdropClick: false };
    expect(shouldCloseDialog('backdrop', policy)).toBe(false);
    expect(shouldCloseDialog('escape', policy)).toBe(true);
    expect(shouldCloseDialog('button', policy)).toBe(true);
  });

  it('preventClose면 어떤 방법으로도 닫지 않는다', () => {
    const policy = { preventClose: true };
    expect(shouldCloseDialog('escape', policy)).toBe(false);
    expect(shouldCloseDialog('backdrop', policy)).toBe(false);
    expect(shouldCloseDialog('button', policy)).toBe(false);
  });
});

describe('isOwnDialogEvent', () => {
  it('다이얼로그 자신에서 생긴 이벤트만 true', () => {
    const dialog = {};
    expect(isOwnDialogEvent({ target: dialog, currentTarget: dialog })).toBe(true);
    expect(isOwnDialogEvent({ target: {}, currentTarget: dialog })).toBe(false);
  });
});
