/** 프론트 초대 수락 페이지 경로 */
export const INVITE_PATH = '/invite';

/**
 * 백엔드 `invite_url`은 백엔드 주소(`/invitations/accept?token=`)로 오므로,
 * `token`만 꺼내 프론트 `/invite?token=` 링크로 바꿉니다. 토큰이 없으면 원본을 그대로 씁니다.
 */
export function toInviteLink(inviteUrl: string, origin: string): string {
  let token: string | null = null;
  try {
    token = new URL(inviteUrl, origin).searchParams.get('token');
  } catch {
    // 잘못된 URL이면 원본을 보여 줍니다.
  }
  if (!token) return inviteUrl;
  return `${origin}${INVITE_PATH}?${new URLSearchParams({ token })}`;
}
