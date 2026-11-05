import { describe, expect, it } from 'vitest';

import { isValidDeploymentUrl, validateReviewRequestForm } from './form';

describe('isValidDeploymentUrl', () => {
  it('https URL만 받는다', () => {
    expect(isValidDeploymentUrl('https://respec.vercel.app')).toBe(true);
    expect(isValidDeploymentUrl('  https://respec.vercel.app/shop  ')).toBe(true);
    expect(isValidDeploymentUrl('http://respec.vercel.app')).toBe(false);
    expect(isValidDeploymentUrl('respec.vercel.app')).toBe(false);
    expect(isValidDeploymentUrl('')).toBe(false);
  });

  it('계정 정보가 들어간 URL은 받지 않는다', () => {
    expect(isValidDeploymentUrl('https://user:pass@respec.vercel.app')).toBe(false);
  });
});

describe('validateReviewRequestForm', () => {
  it('모두 채우면 null', () => {
    expect(
      validateReviewRequestForm('https://respec.vercel.app', new Map([[1, '버튼 색 변경']])),
    ).toBeNull();
  });

  it('선택한 요청이 없으면 에러', () => {
    expect(validateReviewRequestForm('https://respec.vercel.app', new Map())?.items).toBeTruthy();
  });

  it('반영 설명이 빈 요청 id를 알려 준다', () => {
    const errors = validateReviewRequestForm(
      'https://respec.vercel.app',
      new Map([
        [1, '완료'],
        [2, '  '],
      ]),
    );
    expect(errors?.emptyNoteIds).toEqual([2]);
  });

  it('URL이 비었거나 https가 아니면 에러', () => {
    expect(validateReviewRequestForm('', new Map([[1, '완료']]))?.deploymentUrl).toBeTruthy();
    expect(
      validateReviewRequestForm('http://a.com', new Map([[1, '완료']]))?.deploymentUrl,
    ).toBeTruthy();
  });
});
