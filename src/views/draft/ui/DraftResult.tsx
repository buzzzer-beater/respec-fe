'use client';

import { useState } from 'react';

import Link from 'next/link';

import {
  isSiteType,
  SITE_TYPE_LABEL,
  useGetDraftPreviewHtml,
  useGetProjectDraft,
} from '@/entities/project';
import { DownloadDraftButton } from '@/features/download-draft';
import { type Device, DeviceToggle } from '@/features/switch-device';
import { cn, formatRelativeTime } from '@/shared/lib';
import { Button, buttonClassName, Icon } from '@/shared/ui';
import { DraftPreviewFrame } from '@/widgets/site-viewer';

const NEXT_STEPS = [
  {
    title: '직접 써 보고 핀으로 요청하기',
    detail: '고칠 곳을 짚고 말로 적으면 AI가 개발 요청으로 바꿔요',
  },
  { title: '개발자 초대하기', detail: '초대 링크를 보내면 요청과 코드를 함께 받아요' },
  { title: '완성본 검수하기', detail: '개발자가 올린 사이트를 써 보고 승인해요' },
];

const FRAME_WIDTH: Record<Device, string> = {
  desktop: 'max-w-full',
  tablet: 'max-w-[820px]',
  mobile: 'max-w-[390px]',
};

interface DraftResultProps {
  projectId: number;
  /** 초안을 만들 때 적은 설명 */
  prompt: string;
  /** 입력 화면으로 돌아갑니다. 적어 둔 내용은 그대로 있습니다. */
  onRemake: () => void;
}

/**
 * demo-design `.step-done`: 작업 화면과 같은 틀. 왼쪽에서 초안을 직접 써 보고, 오른쪽에서 다음 단계를 안내합니다.
 * GitHub 저장소 만들기는 하지 않고 ZIP으로 코드를 받습니다.
 */
const DraftResult = ({ projectId, prompt, onRemake }: DraftResultProps) => {
  const { data: draft } = useGetProjectDraft(projectId);
  const preview = useGetDraftPreviewHtml(projectId, draft);
  const [device, setDevice] = useState<Device>('desktop');
  const [reloadKey, setReloadKey] = useState(0);
  const siteType = draft?.site_type;
  const typeLabel = isSiteType(siteType) ? SITE_TYPE_LABEL[siteType] : null;
  const madeAt = draft ? formatRelativeTime(draft.updated_at) : null;

  return (
    <section className="grid h-full min-h-0 grid-cols-1 min-[1361px]:grid-cols-[minmax(0,1fr)_440px] lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="bg-stage relative flex min-h-[480px] min-w-0 justify-center px-10 pt-8 pb-[104px]">
        <div
          className={cn(
            'relative h-full w-full animate-[pop-in_0.45s_var(--ease-out-soft)] overflow-hidden rounded-[10px] bg-white shadow-[0_0_0_1px_rgba(24,24,27,0.06),0_8px_30px_rgba(24,24,27,0.08)] transition-[max-width] duration-450 ease-[var(--ease-out-soft)]',
            FRAME_WIDTH[device],
          )}
        >
          <DraftPreviewFrame
            key={reloadKey}
            html={preview.data}
            error={preview.error}
            mode="browse"
            pins={[]}
          />
        </div>
        <div className="absolute bottom-8 left-1/2 z-[3] flex -translate-x-1/2 items-center gap-1.5 rounded-[14px] bg-white p-[5px] shadow-[0_2px_12px_rgba(24,24,27,0.12)]">
          <DeviceToggle value={device} onChange={setDevice} variant="dock" />
          <span className="bg-divider h-[22px] w-px" />
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="text-text hover:bg-hover inline-flex h-10 items-center gap-1.5 rounded-[10px] px-3.5 text-sm font-semibold whitespace-nowrap"
          >
            <Icon name="refresh" size={15} />
            새로고침
          </button>
        </div>
      </div>

      <aside className="border-divider flex min-h-0 animate-[slide-in_0.35s_var(--ease-out-soft)] flex-col border-l bg-white">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="px-9 py-8">
            <h2 className="text-[22px] font-extrabold">초안이 준비됐어요</h2>
            <p className="text-muted mt-1.5 text-sm">왼쪽 화면에서 직접 눌러 보고 써 보세요.</p>
          </div>
          <div className="border-divider border-t px-9 py-8">
            <h3 className="mb-3.5 text-base font-extrabold">내가 적은 방향</h3>
            <p className="text-text text-[15px] leading-[1.65] wrap-anywhere whitespace-pre-wrap">
              {prompt}
            </p>
            {(typeLabel || madeAt) && (
              <p className="text-muted mt-2.5 text-[13px]">
                {[typeLabel, madeAt && `${madeAt} 만듦`].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <div className="border-divider border-t px-9 py-8">
            <h3 className="mb-3.5 text-base font-extrabold">다음 단계</h3>
            <ol className="grid">
              {NEXT_STEPS.map((step, index) => {
                const isNow = index === 0;
                const isLast = index === NEXT_STEPS.length - 1;
                return (
                  <li
                    key={step.title}
                    className={cn(
                      'text-muted relative grid gap-[3px] pl-[38px]',
                      !isLast && 'pb-5',
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'absolute -top-px left-0 grid size-6 place-items-center rounded-full text-xs font-extrabold',
                        isNow ? 'bg-brand text-white' : 'bg-stage text-muted',
                      )}
                    >
                      {index + 1}
                    </span>
                    {!isLast && (
                      <span
                        aria-hidden
                        className="bg-divider absolute top-7 bottom-1 left-[11.5px] w-px"
                      />
                    )}
                    <b className={cn('text-[15px]', isNow ? 'text-ink' : 'text-text')}>
                      {step.title}
                    </b>
                    <span className="text-[13px] leading-normal">{step.detail}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
        <div className="border-divider grid gap-2 border-t bg-white px-9 pt-5 pb-8">
          <Link href={`/projects/${projectId}/viewer`} className={buttonClassName({ size: 'lg' })}>
            작업 화면에서 요청 남기기
          </Link>
          <div className="flex gap-2">
            <Button variant="secondary" size="lg" onClick={onRemake} className="flex-1">
              다시 만들기
            </Button>
            <DownloadDraftButton
              projectId={projectId}
              variant="large"
              label="코드 받기 (ZIP)"
              downloadedMessage="ZIP 파일을 내려받았어요"
              fullWidth
            />
          </div>
        </div>
      </aside>
    </section>
  );
};

export default DraftResult;
