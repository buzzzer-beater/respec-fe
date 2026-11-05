import { describe, expect, it } from 'vitest';

import { resolveViewerSite } from './site';

const both = { hasDraft: true, hasDeployment: true };

describe('resolveViewerSite', () => {
  it('고른 사이트가 있으면 그것을 본다', () => {
    expect(resolveViewerSite('draft', both)).toBe('draft');
    expect(resolveViewerSite('deployed', both)).toBe('deployed');
  });

  it('고르지 않았으면 초안을 먼저 본다', () => {
    expect(resolveViewerSite(null, both)).toBe('draft');
    expect(resolveViewerSite('unknown', both)).toBe('draft');
  });

  it('초안이 없으면 배포본을 본다', () => {
    expect(resolveViewerSite(null, { hasDraft: false, hasDeployment: true })).toBe('deployed');
  });

  it('배포 전에 배포본을 고르면 초안을 본다', () => {
    expect(resolveViewerSite('deployed', { hasDraft: true, hasDeployment: false })).toBe('draft');
  });

  it('초안이 없는데 초안을 고르면 배포본을 본다', () => {
    expect(resolveViewerSite('draft', { hasDraft: false, hasDeployment: true })).toBe('deployed');
  });

  it('둘 다 없으면 null', () => {
    expect(resolveViewerSite('draft', { hasDraft: false, hasDeployment: false })).toBeNull();
  });
});
