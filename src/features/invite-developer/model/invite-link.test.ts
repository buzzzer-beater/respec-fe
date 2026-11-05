import { describe, expect, it } from 'vitest';

import { toInviteLink } from './invite-link';

const ORIGIN = 'https://respec.app';

describe('toInviteLink', () => {
  it('백엔드 주소의 token을 꺼내 프론트 초대 링크로 바꾼다', () => {
    expect(toInviteLink('http://api.local:8000/invitations/accept?token=abc-_1', ORIGIN)).toBe(
      'https://respec.app/invite?token=abc-_1',
    );
  });

  it('특수 문자가 있는 token은 인코딩한다', () => {
    expect(toInviteLink('https://api.test/x?token=a%2Bb%3D', ORIGIN)).toBe(
      'https://respec.app/invite?token=a%2Bb%3D',
    );
  });

  it('상대 경로도 처리한다', () => {
    expect(toInviteLink('/invitations/accept?token=xyz', ORIGIN)).toBe(
      'https://respec.app/invite?token=xyz',
    );
  });

  it('token이 없으면 원본을 그대로 쓴다', () => {
    expect(toInviteLink('https://api.test/invite/abc', ORIGIN)).toBe('https://api.test/invite/abc');
    expect(toInviteLink('https://api.test/x?token=', ORIGIN)).toBe('https://api.test/x?token=');
  });
});
