'use client';

import Link from 'next/link';

import { useGetDraftPreviewHtml, useGetProjectDraft } from '@/entities/project';
import { DownloadDraftButton } from '@/features/download-draft';
import { buttonClassName } from '@/shared/ui';
import { DraftPreviewFrame } from '@/widgets/site-viewer';

const NEXT_STEPS = [
  {
    title: '직접 써 보고 핀으로 요청하기',
    detail: '고칠 곳을 짚고 말로 적으면 AI가 개발 요청으로 바꿔요',
  },
  { title: '개발자 초대하기', detail: '초대 링크를 보내면 요청과 코드를 함께 받아요' },
  { title: '완성본 검수하기', detail: '개발자가 올린 사이트를 써 보고 승인해요' },
];

interface DraftResultProps {
  projectId: number;
  /** 초안을 만들 때 적은 설명 */
  prompt: string | null;
  /** 입력 화면으로 돌아갑니다. 적어 둔 내용은 그대로 있습니다. */
  onRemake: () => void;
}

/**
 * 초안을 다 만든 뒤 보여 주는 결과 화면. 왼쪽에서 초안을 직접 써 보고,
 * 오른쪽에서 다음 단계를 안내합니다. GitHub 저장소 만들기는 하지 않고 ZIP으로 코드를 받습니다.
 */
const DraftResult = ({ projectId, prompt, onRemake }: DraftResultProps) => {
  const { data: draft } = useGetProjectDraft(projectId);
  const preview = useGetDraftPreviewHtml(projectId, draft);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-6 py-6 lg:flex-row lg:py-8">
      <div className="bg-stage relative min-h-[420px] flex-1 overflow-hidden rounded-[14px] shadow-[0_0_0_1px_rgba(24,24,27,0.06)]">
        <DraftPreviewFrame html={preview.data} error={preview.error} mode="browse" pins={[]} />
      </div>

      <aside className="flex w-full shrink-0 flex-col gap-7 lg:w-[360px]">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[26px] font-extrabold tracking-[-0.02em]">초안이 준비됐어요</h1>
          <p className="text-muted text-sm">왼쪽 화면에서 직접 눌러 보고 써 보세요.</p>
        </div>

        {prompt && (
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-bold">내가 적은 방향</h2>
            <p className="bg-stage text-text rounded-xl px-4 py-3 text-sm leading-relaxed wrap-anywhere whitespace-pre-wrap">
              {prompt}
            </p>
          </section>
        )}

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-bold">다음 단계</h2>
          <ol className="flex flex-col gap-4">
            {NEXT_STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span
                  className={
                    index === 0
                      ? 'bg-ink grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold text-white'
                      : 'bg-hover text-muted grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold'
                  }
                >
                  {index + 1}
                </span>
                <span className="flex flex-col gap-0.5">
                  <b className={index === 0 ? 'text-ink text-sm' : 'text-text text-sm'}>
                    {step.title}
                  </b>
                  <span className="text-muted text-[13px] leading-snug">{step.detail}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-auto flex flex-col gap-2">
          <Link
            href={`/projects/${projectId}/viewer`}
            className={buttonClassName({ className: 'grid h-12 place-items-center' })}
          >
            작업 화면에서 요청 남기기
          </Link>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onRemake}
              className={buttonClassName({ variant: 'secondary', className: 'h-11 flex-1' })}
            >
              다시 만들기
            </button>
            <DownloadDraftButton
              projectId={projectId}
              label="코드 받기 (ZIP)"
              fullWidth
              className="h-11 w-full rounded-xl"
            />
          </div>
        </div>
      </aside>
    </div>
  );
};

export default DraftResult;
