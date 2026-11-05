import Image from 'next/image';

import { DraftPromptForm } from '@/features/generate-draft';

import logoMarkLarge from '../assets/logo-mark-large.svg';

const DraftView = () => {
  return (
    <main className="shadow-elevation-2 flex h-full min-w-0 flex-1 flex-col items-center justify-center overflow-y-auto bg-white px-8">
      <div className="flex w-full max-w-3xl flex-col items-center gap-15 pb-20">
        <Image src={logoMarkLarge} alt="" unoptimized priority />
        <div className="flex flex-col items-center gap-2.5 leading-[normal]">
          <h1 className="text-[56px] font-semibold whitespace-nowrap text-black">
            어떤 사이트를 만들까요?
          </h1>
          <p className="text-ink-400 w-min min-w-full text-center text-xl">
            프로젝트 이름과 원하는 방향을 알려주시면, 화면 구조와 기획 초안을 먼저 정리해 드릴게요.
          </p>
        </div>
        <DraftPromptForm />
      </div>
    </main>
  );
};

export default DraftView;
