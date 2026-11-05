'use client';

import { type FormEvent, useState } from 'react';

import type { ApiError } from '@/shared/api';
import { Button, Dialog, DialogTitle, Input } from '@/shared/ui';

import { usePutProjectDeployment } from '../api/deployment';
import {
  DEPLOYMENT_URL_ERROR_MESSAGE,
  isVercelAppUrl,
  validateDeploymentUrl,
} from '../model/deployment-url';
import PinScriptGuide from './PinScriptGuide';

const getServerErrorMessage = (error: ApiError) => {
  if (error.status === 422) {
    return '서버가 이 주소를 받지 않았어요. https://로 시작하고 아이디나 비밀번호가 없는 주소인지 확인해 주세요.';
  }
  if (error.status === 403) return '배포 사이트는 이 프로젝트의 개발자만 연결할 수 있어요.';
  return error.message;
};

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
  const [value, setValue] = useState(currentUrl ?? '');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [connectedUrl, setConnectedUrl] = useState<string | null>(null);
  const putDeployment = usePutProjectDeployment(projectId);

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
    <Dialog onClose={onClose}>
      <div className="flex flex-col gap-5 p-6">
        <DialogTitle>{connectedUrl ? '배포 사이트를 연결했어요' : title}</DialogTitle>

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
            <Button autoFocus onClick={onClose} className="h-11">
              확인
            </Button>
          </>
        ) : (
          <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="deployment-url" className="text-text text-sm font-semibold">
                배포 사이트 주소
              </label>
              <Input
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

            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose} className="h-11 flex-1">
                취소
              </Button>
              <Button type="submit" disabled={putDeployment.isPending} className="h-11 flex-1">
                {putDeployment.isPending ? '연결하는 중…' : isChange ? '변경하기' : '연결하기'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Dialog>
  );
};

export default ConnectDeploymentDialog;
