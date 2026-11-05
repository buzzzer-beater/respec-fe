'use client';

import { type FormEvent, useState } from 'react';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import type { ApiError } from '@/shared/api';
import { getSafeNextPath } from '@/shared/lib';

import { usePostLogin, usePostSignup } from '../api/auth';

// 백엔드 `Credentials` 검증과 같은 규칙입니다.
const PASSWORD_PATTERN = /^[A-Za-z0-9.!_-]{4,256}$/;

const COPY = {
  login: {
    title: '로그인',
    submit: '로그인',
    switchText: '아직 계정이 없나요?',
    switchLabel: '회원가입',
    switchHref: '/signup',
  },
  signup: {
    title: '회원가입',
    submit: '가입하기',
    switchText: '이미 계정이 있나요?',
    switchLabel: '로그인',
    switchHref: '/login',
  },
} as const;

const toMessage = (error: ApiError) => {
  if (error.code === 'EMAIL_ALREADY_REGISTERED') return '이미 가입한 이메일이에요.';
  if (error.code === 'UNAUTHORIZED') return '이메일 또는 비밀번호가 맞지 않아요.';
  if (error.code === 'VALIDATION_ERROR') return '이메일 형식을 확인해 주세요.';
  return error.message;
};

interface AuthFormProps {
  mode: 'login' | 'signup';
}

const AuthForm = ({ mode }: AuthFormProps) => {
  const router = useRouter();
  // 보호 페이지에서 넘어왔다면 로그인 후 그 페이지로 돌아갑니다.
  const next = useSearchParams().get('next');
  const login = usePostLogin();
  const signup = usePostSignup();
  const mutation = mode === 'login' ? login : signup;
  const copy = COPY[mode];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mode === 'signup' && !PASSWORD_PATTERN.test(password)) {
      setInputError('비밀번호는 4자 이상, 영문·숫자·. ! _ - 만 쓸 수 있어요.');
      return;
    }
    setInputError(null);
    mutation.mutate(
      { email: email.trim(), password },
      {
        onSuccess: () => router.replace(getSafeNextPath(next)),
      },
    );
  };

  const errorMessage = inputError ?? (mutation.error ? toMessage(mutation.error) : null);
  const inputClassName =
    'border-field text-ink placeholder:text-faint focus:border-ink h-12 w-full rounded-xl border bg-white px-4 outline-none transition-colors';

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-7">
      <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">{copy.title}</h1>
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-text text-sm font-semibold">이메일</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClassName}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-text text-sm font-semibold">비밀번호</span>
          <input
            type="password"
            required
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClassName}
          />
        </label>
      </div>
      {errorMessage && (
        <p role="alert" className="text-warn text-sm font-semibold">
          {errorMessage}
        </p>
      )}
      <button
        type="submit"
        disabled={mutation.isPending}
        className="bg-ink h-12 rounded-xl font-semibold text-white transition-transform hover:bg-[#34322e] active:scale-[0.98] disabled:opacity-60"
      >
        {mutation.isPending ? '잠시만요…' : copy.submit}
      </button>
      <p className="text-muted text-center text-sm">
        {copy.switchText}{' '}
        <Link
          href={next ? `${copy.switchHref}?next=${encodeURIComponent(next)}` : copy.switchHref}
          className="text-ink font-bold underline underline-offset-4"
        >
          {copy.switchLabel}
        </Link>
      </p>
    </form>
  );
};

export default AuthForm;
