'use client';

import NewProjectDraft from './NewProjectDraft';
import ProjectDraft from './ProjectDraft';

interface DraftViewProps {
  /** 없으면 새 프로젝트를 만들면서 초안을 생성합니다. */
  projectId?: number;
}

const DraftView = ({ projectId }: DraftViewProps) =>
  projectId === undefined ? <NewProjectDraft /> : <ProjectDraft projectId={projectId} />;

export default DraftView;
