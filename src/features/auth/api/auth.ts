import { useMutation } from '@tanstack/react-query';

import { type AccessToken, saveSession, type User } from '@/entities/user';
import { post } from '@/shared/api';

export interface CredentialsReqType {
  email: string;
  password: string;
}

export const postSignup = (body: CredentialsReqType) => post<User>('/auth/signup', body);

export const postLogin = (body: CredentialsReqType) => post<AccessToken>('/auth/login', body);

export const usePostLogin = () =>
  useMutation({
    mutationFn: postLogin,
    onSuccess: ({ access_token }, { email }) => saveSession(access_token, email),
  });

/** 가입하고 바로 로그인합니다. */
export const usePostSignup = () =>
  useMutation({
    mutationFn: async (body: CredentialsReqType) => {
      await postSignup(body);
      return postLogin(body);
    },
    onSuccess: ({ access_token }, { email }) => saveSession(access_token, email),
  });
