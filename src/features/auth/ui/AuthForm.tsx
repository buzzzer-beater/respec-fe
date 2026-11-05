'use client';

import { type FormEvent, useState } from 'react';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import type { ApiError } from '@/shared/api';
import { getSafeNextPath } from '@/shared/lib';
import { buttonClassName, Icon } from '@/shared/ui';

import { usePostLogin, usePostSignup } from '../api/auth';

// 백엔드 `Credentials` 검증과 같은 규칙입니다.
const PASSWORD_PATTERN = /^[A-Za-z0-9.!_-]{4,256}$/;
const EMAIL_PATTERN = /^[^@\s]+@[^@.\s]+(\.[^@.\s]+)+$/;

const COPY = {
  login: {
    title: '로그인',
    sub: '이메일과 비밀번호로 들어가요',
    submit: '로그인',
    switchText: '아직 계정이 없나요?',
    switchLabel: '회원가입',
    switchHref: '/signup',
  },
  signup: {
    title: '회원가입',
    sub: '이메일 하나면 바로 시작할 수 있어요',
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

const fieldClassName =
  'border-field text-ink focus:border-ink h-[50px] w-full rounded-xl border bg-white px-4 text-[15px] outline-none transition-colors duration-200';

interface AuthFormProps {
  mode: 'login' | 'signup';
}

/** demo-design `login.html` 오른쪽 폼. 브라우저 기본 검사 대신 아래 오류 한 줄로 알려 줍니다. */
const AuthForm = ({ mode }: AuthFormProps) => {
  const router = useRouter();
  // 보호 페이지에서 넘어왔다면 로그인 후 그 페이지로 돌아갑니다.
  const next = useSearchParams().get('next');
  const login = usePostLogin();
  const signup = usePostSignup();
  const mutation = mode === 'login' ? login : signup;
  const copy = COPY[mode];
  const isSignup = mode === 'signup';
  // 초대 링크로 들어왔다가 로그인하러 온 경우
  const fromInvite = next?.startsWith('/invite') ?? false;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  const check = () => {
    if (!EMAIL_PATTERN.test(email.trim())) return '이메일 형식을 확인해 주세요.';
    if (isSignup) {
      if (!PASSWORD_PATTERN.test(password))
        return '비밀번호는 4자 이상, 영문·숫자·. ! _ - 만 쓸 수 있어요.';
      if (password !== confirm) return '비밀번호가 서로 달라요.';
    }
    if (!password) return '비밀번호를 입력해 주세요.';
    return null;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const error = check();
    setInputError(error);
    if (error) return;
    mutation.mutate(
      { email: email.trim(), password },
      { onSuccess: () => router.replace(getSafeNextPath(next)) },
    );
  };

  const errorMessage = inputError ?? (mutation.error ? toMessage(mutation.error) : null);

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="grid w-[min(380px,100%)] animate-[pop-in_0.4s_var(--ease-out-soft)] gap-7"
    >
      <title>{`RE:SPEC — ${copy.title}`}</title>
      <div>
        <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">{copy.title}</h1>
        <p className="text-muted mt-1.5 text-sm">{copy.sub}</p>
      </div>

      {fromInvite && (
        <p className="bg-ai text-text flex gap-2.5 rounded-xl px-4 py-3.5 text-[13px] leading-normal">
          <Icon name="link" size={16} className="mt-0.5" />
          <span>{isSignup ? '가입하면' : '로그인하면'} 받은 초대를 바로 볼 수 있어요</span>
        </p>
      )}

      <div className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-text text-[13px] font-bold">이메일</span>
          <input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={fieldClassName}
          />
        </label>
        <label className="grid gap-2">
          <span className="text-text text-[13px] font-bold">비밀번호</span>
          <input
            type="password"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={fieldClassName}
          />
          {isSignup && (
            <small className="text-faint text-xs">
              4자 이상, 영문·숫자·. ! _ - 만 쓸 수 있어요
            </small>
          )}
        </label>
        {isSignup && (
          <label className="grid gap-2">
            <span className="text-text text-[13px] font-bold">비밀번호 확인</span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className={fieldClassName}
            />
          </label>
        )}
      </div>

      {errorMessage && (
        <p role="alert" className="text-warn -mt-3 text-[13px] font-semibold">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        className={buttonClassName({ className: 'h-[52px] text-[15px] hover:-translate-y-px' })}
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
