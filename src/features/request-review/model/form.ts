/** 백엔드처럼 https이고 계정 정보가 없는 URL만 받습니다. */
export function isValidDeploymentUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' && !url.username && !url.password && url.hostname !== '';
  } catch {
    return false;
  }
}

export interface ReviewRequestFormErrors {
  deploymentUrl?: string;
  items?: string;
  /** 반영 설명이 빈 요청 id */
  emptyNoteIds: number[];
}

/** 선택한 요청 id → 반영 설명. 선택 순서를 지키려고 `Map`을 씁니다. */
export type ReviewNotes = Map<number, string>;

export function validateReviewRequestForm(
  deploymentUrl: string,
  notes: ReviewNotes,
): ReviewRequestFormErrors | null {
  const errors: ReviewRequestFormErrors = { emptyNoteIds: [] };

  if (!deploymentUrl.trim()) errors.deploymentUrl = '검수할 배포 URL을 입력해 주세요.';
  else if (!isValidDeploymentUrl(deploymentUrl))
    errors.deploymentUrl = 'https://로 시작하는 주소를 입력해 주세요.';

  if (notes.size === 0) errors.items = '검수받을 요청을 하나 이상 골라 주세요.';
  for (const [id, note] of notes) {
    if (!note.trim()) errors.emptyNoteIds.push(id);
  }

  const hasError = errors.deploymentUrl || errors.items || errors.emptyNoteIds.length > 0;
  return hasError ? errors : null;
}
