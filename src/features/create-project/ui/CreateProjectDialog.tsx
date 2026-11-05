'use client';

import { type FormEvent, useState } from 'react';

import { type Project, usePostProject } from '@/entities/project';
import { Dialog, DialogTitle } from '@/shared/ui';

const PROJECT_NAME_MAX = 40;

interface CreateProjectDialogProps {
  onClose: () => void;
  onCreated: (project: Project) => void;
}

/** 열 때 렌더링하고 닫을 때 언마운트해서 입력값을 초기화합니다. */
const CreateProjectDialog = ({ onClose, onCreated }: CreateProjectDialogProps) => {
  const postProject = usePostProject();
  const [name, setName] = useState('');
  const trimmed = name.trim();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmed || postProject.isPending) return;
    postProject.mutate({ name: trimmed }, { onSuccess: onCreated });
  };

  return (
    <Dialog
      onClose={onClose}
      // 만드는 중에는 닫지 않습니다.
      preventClose={postProject.isPending}
      closeOnBackdropClick={false}
      className="w-[448px]"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-7">
        <DialogTitle className="text-xl">새 프로젝트</DialogTitle>
        <label className="flex flex-col gap-2">
          <span className="text-text text-sm font-semibold">프로젝트 이름</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={PROJECT_NAME_MAX}
            required
            autoFocus
            disabled={postProject.isPending}
            placeholder="Ex. 노트핏 랜딩 페이지"
            className="border-field focus:border-ink h-11 rounded-[10px] border px-3 outline-none"
          />
        </label>
        {postProject.error && (
          <p role="alert" className="text-warn text-sm font-semibold">
            프로젝트를 만들지 못했어요. {postProject.error.message}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={postProject.isPending}
            className="border-field hover:border-ink h-10 rounded-[10px] border px-4 text-sm font-semibold"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={!trimmed || postProject.isPending}
            className="bg-ink disabled:bg-divider h-10 rounded-[10px] px-4 text-sm font-semibold text-white"
          >
            {postProject.isPending ? '만드는 중…' : '만들기'}
          </button>
        </div>
      </form>
    </Dialog>
  );
};

export default CreateProjectDialog;
