'use client';

import { useEffect, useState } from 'react';

import { getFrameAncestorsConfig, getPinScriptTag } from '../model/pin-script-guide';

const COPIED_DURATION_MS = 2000;

const CodeBlock = ({ label, code }: { label: string; code: string }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), COPIED_DURATION_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      // 클립보드 권한이 없으면 사용자가 직접 복사합니다.
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-text text-xs font-semibold">{label}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="text-brand text-xs font-semibold hover:underline"
        >
          {copied ? '복사했어요' : '복사'}
        </button>
      </div>
      <pre className="border-divider text-ink overflow-x-auto rounded-lg border bg-white px-3 py-2 font-mono text-[11px] leading-normal select-all">
        {code}
      </pre>
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
          고객이 요소를 골라 핀을 남기려면 배포 사이트에 아래 두 가지를 넣고 다시 배포해 주세요.
          넣지 않으면 화면 위치로만 핀이 남아요.
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
