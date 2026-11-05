'use client';

import { useState } from 'react';

import { CopyButton } from '@/shared/ui';

import { getFrameAncestorsConfig, getPinScriptTag } from '../model/pin-script-guide';

const CodeBlock = ({ label, code }: { label: string; code: string }) => {
  const [copyFailed, setCopyFailed] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-text text-xs font-semibold">{label}</span>
        <CopyButton
          text={code}
          onCopyError={() => setCopyFailed(true)}
          className="text-brand text-xs font-semibold hover:underline"
        />
      </div>
      <pre className="border-divider text-ink overflow-x-auto rounded-lg border bg-white px-3 py-2 font-mono text-[11px] leading-normal select-all">
        {code}
      </pre>
      {/* 클립보드 권한이 없으면 사용자가 직접 복사합니다. 코드 상자는 한 번 누르면 전체 선택돼요. */}
      {copyFailed && (
        <p role="alert" className="text-warn text-xs font-semibold">
          복사하지 못했어요. 코드를 눌러 선택한 뒤 직접 복사해 주세요.
        </p>
      )}
    </div>
  );
};

/** 배포 사이트에 핀 스크립트를 넣는 방법. 대화상자를 열 때 마운트되므로 브라우저 주소를 바로 읽습니다. */
const PinScriptGuide = () => {
  const appOrigin = typeof window === 'undefined' ? '' : window.location.origin;

  return (
    <section className="bg-ai flex flex-col gap-3 rounded-xl px-4 py-3.5">
      <div className="flex flex-col gap-1">
        <h3 className="text-ink text-sm font-bold">핀 스크립트 설치</h3>
        <p className="text-muted text-[13px] leading-normal">
          고객이 배포 사이트에 핀을 남기려면 아래 두 가지를 넣고 다시 배포해 주세요. 넣지 않으면
          핀을 남길 수 없어요.
        </p>
      </div>
      <CodeBlock label="1. <head> 안에 스크립트 한 줄" code={getPinScriptTag(appOrigin)} />
      <CodeBlock
        label="2. vercel.json: RE:SPEC 화면 안에서 열리도록 허용"
        code={getFrameAncestorsConfig(appOrigin)}
      />
      <p className="text-muted text-xs leading-normal">
        스크립트는 RE:SPEC 화면 안에서 열렸을 때만 동작하고, 방문자가 사이트를 직접 열 때는 아무것도
        하지 않아요.
      </p>
    </section>
  );
};

export default PinScriptGuide;
