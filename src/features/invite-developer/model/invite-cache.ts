import type { ProjectInvitation } from '@/entities/project';

/**
 * 백엔드에는 지금 초대 링크를 다시 보는 API가 없고(토큰을 해시로만 저장), 새로 발급하면 이전 링크가 꺼집니다.
 * 그래서 이 브라우저에서 발급한 링크를 만료 전까지 보관해 두고, 대화상자를 다시 열 때 그대로 보여 줍니다.
 * 다른 브라우저에서 열면 새 링크를 발급하므로 이전 링크는 꺼집니다.
 */
const storageKey = (projectId: number) => `respec:invitation:${projectId}`;

const isInvitation = (value: unknown): value is ProjectInvitation =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as ProjectInvitation).invite_url === 'string' &&
  typeof (value as ProjectInvitation).expires_at === 'string';

/** 만료 전인 보관 링크. 없거나 읽을 수 없으면 `null` */
export const readCachedInvitation = (projectId: number, now = Date.now()) => {
  try {
    const raw = localStorage.getItem(storageKey(projectId));
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!isInvitation(value)) return null;
    // 만료 1분 전부터는 새로 발급합니다.
    return new Date(value.expires_at).getTime() - now > 60_000 ? value : null;
  } catch {
    return null;
  }
};

export const writeCachedInvitation = (projectId: number, invitation: ProjectInvitation | null) => {
  try {
    if (invitation) localStorage.setItem(storageKey(projectId), JSON.stringify(invitation));
    else localStorage.removeItem(storageKey(projectId));
  } catch {
    // 저장할 수 없는 브라우저에서는 열 때마다 새로 발급합니다.
  }
};
