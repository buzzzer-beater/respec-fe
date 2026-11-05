import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { AccessToken, User } from '@/entities/user';
import { post, setAccessToken } from '@/shared/api';

export interface CredentialsReqType {
  email: string;
  password: string;
}

export const postSignup = (body: CredentialsReqType) => post<User>('/auth/signup', body);

export const postLogin = (body: CredentialsReqType) => post<AccessToken>('/auth/login', body);

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
