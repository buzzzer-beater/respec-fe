'use client';

import { type FormEvent, useRef, useState } from 'react';

import type { ApiError } from '@/shared/api';
import {
  Button,
  buttonClassName,
  CopyButton,
  Dialog,
  DialogBanner,
  DialogContent,
  DialogFooter,
  DialogTitle,
  Input,
  toast,
} from '@/shared/ui';

import { usePutProjectDeployment } from '../api/deployment';
import {
  DEPLOYMENT_URL_ERROR_MESSAGE,
  toDeploymentHost,
  validateDeploymentUrl,
} from '../model/deployment-url';
import { getPinScriptTag } from '../model/pin-script-guide';

const getServerErrorMessage = (error: ApiError) => {
  if (error.status === 422) return DEPLOYMENT_URL_ERROR_MESSAGE.invalid;
  if (error.status === 403) return '배포 주소는 이 프로젝트의 개발자만 연결할 수 있어요.';
  return error.message;
};

const FIELD_LABEL_CLASS = 'text-text mb-2 block text-[13px] font-bold';

interface ConnectDeploymentDialogProps {
  projectId: number;
  /** 이미 연결된 주소. 있으면 변경 화면으로 엽니다. */
  currentUrl: string | null;
  /** 대화상자를 연 이유. 있으면 제목 아래에 회색 안내로 보여 줍니다(예: 핀 스크립트 설치 안내). */
  banner?: string;
  onClose: () => void;
  /** 새 주소를 저장한 뒤. 대화상자는 스스로 닫히고, 부모는 배포본 B로 옮기는 데 씁니다. */
  onConnected?: (url: string) => void;
}

/** demo-design `#deployModal`. 열릴 때 마운트하고 닫히면 언마운트하는 방식으로 씁니다. */
const ConnectDeploymentDialog = ({
  projectId,
  currentUrl,
  banner,
  onClose,
  onConnected,
}: ConnectDeploymentDialogProps) => {
  const [value, setValue] = useState(currentUrl ?? '');
  // 시안처럼 보낼 때만 검사하고, 다시 입력하면 오류를 지웁니다.
  const [fieldError, setFieldError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const putDeployment = usePutProjectDeployment(projectId);
  const isChange = currentUrl !== null;
  const scriptTag = getPinScriptTag(typeof window === 'undefined' ? '' : window.location.origin);

  const errorMessage =
    fieldError ?? (putDeployment.error ? getServerErrorMessage(putDeployment.error) : null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (putDeployment.isPending) return;
    const result = validateDeploymentUrl(value);
    if (!result.ok) {
      setFieldError(DEPLOYMENT_URL_ERROR_MESSAGE[result.error]);
      inputRef.current?.focus();
      return;
    }
    if (result.url === currentUrl) {
      onClose();
      toast('이미 연결된 주소예요');
      return;
    }
    const { droppedPath } = result;
    putDeployment.mutate(
      { deployment_url: result.url },
      {
        onSuccess: ({ deployment_url }) => {
          const host = toDeploymentHost(deployment_url);
          onClose();
          toast(droppedPath ? `경로는 빼고 ${host}로 연결했어요` : `${host}를 연결했어요`);
          onConnected?.(deployment_url);
        },
      },
    );
  };

  return (
    <Dialog onClose={onClose}>
      <form noValidate onSubmit={handleSubmit}>
        <DialogContent>
          <DialogTitle>{isChange ? '배포 주소 변경' : '배포 연결'}</DialogTitle>
          {banner && <DialogBanner>{banner}</DialogBanner>}

          <div>
            <label htmlFor="deployment-url" className={FIELD_LABEL_CLASS}>
              배포 주소
            </label>
            <Input
              ref={inputRef}
              id="deployment-url"
              type="url"
              inputMode="url"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setFieldError(null);
                putDeployment.reset();
              }}
              placeholder="https://my-shop.vercel.app"
              aria-invalid={errorMessage ? true : undefined}
              aria-describedby={errorMessage ? 'deployment-url-error' : undefined}
              disabled={putDeployment.isPending}
              className="text-text h-11 text-sm"
            />
            {errorMessage && (
              <p
                id="deployment-url-error"
                role="alert"
                className="text-warn mt-2 text-[13px] font-semibold"
              >
                {errorMessage}
              </p>
            )}
          </div>

          <div>
            <span className={FIELD_LABEL_CLASS}>핀 스크립트 · 사이트 &lt;head&gt;에 한 줄</span>
            <div className="bg-ink flex items-center gap-2 rounded-xl py-2.5 pr-2.5 pl-3.5">
              <code className="text-chip min-w-0 flex-1 overflow-x-auto font-mono text-xs whitespace-nowrap">
                {scriptTag}
              </code>
              <CopyButton
                text={scriptTag}
                copiedMessage="핀 스크립트를 복사했어요"
                className={buttonClassName({
                  className: 'h-8 bg-[#3f3f46] px-3 text-[13px] hover:bg-[#3f3f46]',
                })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={putDeployment.isPending}>
              {isChange ? '변경하기' : '연결하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
};

export default ConnectDeploymentDialog;
