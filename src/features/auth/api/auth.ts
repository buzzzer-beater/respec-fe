import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { AccessToken, User } from '@/entities/user';
import { getAccessToken, post, setAccessToken } from '@/shared/api';

export interface CredentialsReqType {
  email: string;
  password: string;
}

export const postSignup = (body: CredentialsReqType) => post<User>('/auth/signup', body);

export const postLogin = (body: CredentialsReqType) => post<AccessToken>('/auth/login', body);

/** 서버에서 토큰을 폐기합니다. 토큰을 직접 넘겨서, 저장소에서 먼저 지워도 보낼 수 있습니다. */
export const postLogout = (token: string) =>
  post<void>('/auth/logout', undefined, { headers: { Authorization: `Bearer ${token}` } });

/** 토큰을 저장하고, 이전 사용자의 캐시가 남지 않도록 비웁니다. */
const useStartSession = () => {
  const queryClient = useQueryClient();
  return ({ access_token }: AccessToken) => {
    setAccessToken(access_token);
    queryClient.clear();
  };
};

export const usePostLogin = () => {
  const startSession = useStartSession();
  return useMutation({ mutationFn: postLogin, onSuccess: startSession });
};

/** 가입하고 바로 로그인합니다. */
export const usePostSignup = () => {
  const startSession = useStartSession();
  return useMutation({
    mutationFn: async (body: CredentialsReqType) => {
      await postSignup(body);
      return postLogin(body);
    },
    onSuccess: startSession,
  });
};

/**
 * 로그아웃합니다. 서버 폐기에 실패해도(만료, 네트워크 오류) 브라우저에서는 로그아웃합니다.
 * 토큰을 먼저 지워서, 그 사이 401이 나도 `next`를 붙인 로그인 이동이 일어나지 않게 합니다.
 */
export const usePostLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const token = getAccessToken();
      setAccessToken(null);
      if (token) await postLogout(token).catch(() => undefined);
    },
    // 이전 사용자의 조회 결과를 모두 지웁니다. (`clear`는 진행 중인 이 mutation까지 지웁니다.)
    onSuccess: () => queryClient.removeQueries(),
  });
};
