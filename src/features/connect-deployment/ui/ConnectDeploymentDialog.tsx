'use client';

import { type FormEvent, useEffect, useRef, useState } from 'react';

import type { ApiError } from '@/shared/api';

import { usePutProjectDeployment } from '../api/deployment';
import {
  DEPLOYMENT_URL_ERROR_MESSAGE,
  isVercelAppUrl,
  validateDeploymentUrl,
} from '../model/deployment-url';

const getServerErrorMessage = (error: ApiError) => {
  if (error.status === 422) {
    return '서버가 이 주소를 받지 않았어요. https://로 시작하고 아이디나 비밀번호가 없는 주소인지 확인해 주세요.';
  }
  if (error.status === 403) return '배포 사이트는 이 프로젝트의 개발자만 연결할 수 있어요.';
  return error.message;
};

// 핀 스크립트는 #21에서 만듭니다. 준비되면 설치 방법을 여기에 채웁니다.
const PinScriptGuide = () => (
  <section className="bg-ai flex flex-col gap-1 rounded-xl px-4 py-3.5">
    <h3 className="text-ink text-sm font-bold">핀 스크립트 설치</h3>
    <p className="text-muted text-[13px] leading-normal">
      준비 중이에요. 배포 사이트에 넣을 스크립트가 준비되면 설치 방법을 여기에서 안내할게요.
    </p>
  </section>
);

interface ConnectDeploymentDialogProps {
  projectId: number;
  /** 이미 연결된 주소. 있으면 변경 화면으로 엽니다. */
  currentUrl: string | null;
  onClose: () => void;
}

/** 열릴 때 마운트하고 닫히면 언마운트하는 방식으로 씁니다. */
const ConnectDeploymentDialog = ({
  projectId,
  currentUrl,
  onClose,
}: ConnectDeploymentDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [value, setValue] = useState(currentUrl ?? '');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [connectedUrl, setConnectedUrl] = useState<string | null>(null);
  const putDeployment = usePutProjectDeployment(projectId);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const result = validateDeploymentUrl(value);
  // 처음 제출하기 전에는 입력 중 오류를 보여 주지 않습니다.
  const fieldError = isSubmitted && !result.ok ? DEPLOYMENT_URL_ERROR_MESSAGE[result.error] : null;
  const errorMessage =
    fieldError ?? (putDeployment.error ? getServerErrorMessage(putDeployment.error) : null);
  const isChange = currentUrl !== null;
  const title = isChange ? '배포 사이트 변경' : '배포 사이트 연결';

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitted(true);
    if (!result.ok || putDeployment.isPending) return;
    putDeployment.mutate(
      { deployment_url: result.url },
      { onSuccess: ({ deployment_url }) => setConnectedUrl(deployment_url) },
    );
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="connect-deployment-title"
      onClose={onClose}
      // 바깥(backdrop)을 누르면 닫습니다.
      onClick={(event) => event.target === event.currentTarget && dialogRef.current?.close()}
      className="backdrop:bg-ink/40 m-auto w-[440px] max-w-[calc(100%-32px)] rounded-2xl bg-white p-0 shadow-[0_12px_40px_rgba(24,24,27,0.2)]"
    >
      <div className="flex flex-col gap-5 p-6">
        <h2 id="connect-deployment-title" className="text-ink text-lg font-extrabold">
          {connectedUrl ? '배포 사이트를 연결했어요' : title}
        </h2>

        {connectedUrl ? (
          <>
            <div className="flex flex-col gap-1.5 text-sm leading-normal">
              <a
                href={connectedUrl}
                target="_blank"
                rel="noreferrer"
                className="text-brand font-semibold break-all underline underline-offset-2"
              >
                {connectedUrl}
              </a>
              <p className="text-text">
                고객이 작업 화면에서 이 사이트를 기준으로 검수하고 핀을 남길 수 있어요.
              </p>
            </div>
            <PinScriptGuide />
            <button
              type="button"
              autoFocus
              onClick={() => dialogRef.current?.close()}
              className="bg-ink h-11 rounded-xl text-sm font-semibold text-white transition-transform active:scale-95"
            >
              확인
            </button>
          </>
        ) : (
          <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="deployment-url" className="text-text text-sm font-semibold">
                배포 사이트 주소
              </label>
              <input
                id="deployment-url"
                type="url"
                inputMode="url"
                autoFocus
                autoComplete="off"
                spellCheck={false}
                value={value}
                onChange={(event) => {
                  setValue(event.target.value);
                  putDeployment.reset();
                }}
                placeholder="https://my-project.vercel.app"
                aria-invalid={errorMessage ? true : undefined}
                aria-describedby="deployment-url-hint"
                disabled={putDeployment.isPending}
                className="border-field text-ink placeholder:text-faint focus:border-ink aria-invalid:border-warn h-12 w-full rounded-xl border px-3.5 text-[15px] outline-none"
              />
              <p id="deployment-url-hint" className="text-muted text-xs leading-normal">
                {result.ok && !isVercelAppUrl(value)
                  ? 'Vercel 주소(*.vercel.app)가 아니에요. 연결은 할 수 있지만 Vercel 주소를 권장해요.'
                  : 'Vercel에 배포한 주소(*.vercel.app)를 권장해요.'}
              </p>
              {errorMessage && (
                <p role="alert" className="text-warn text-xs font-semibold">
                  {errorMessage}
                </p>
              )}
            </div>

            {isChange && <PinScriptGuide />}

            <div className="flex gap-2 text-sm font-semibold">
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                className="border-divider text-ink hover:bg-hover h-11 flex-1 rounded-xl border"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={putDeployment.isPending}
                className="bg-ink h-11 flex-1 rounded-xl text-white transition-transform active:scale-95 disabled:opacity-40"
              >
                {putDeployment.isPending ? '연결하는 중…' : isChange ? '변경하기' : '연결하기'}
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
};

export default ConnectDeploymentDialog;
