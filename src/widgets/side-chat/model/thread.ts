import type { PinThreadComment } from './types';

export interface OrderedThreadComment extends PinThreadComment {
  /** 0: 최상위 댓글, 1: 답글. 답글의 답글도 한 단계만 들여씁니다. */
  depth: 0 | 1;
}

/**
 * 댓글을 스레드 순서로 정렬합니다.
 * 최상위 댓글은 작성 순서대로 두고, 각 최상위 댓글 바로 아래에 그 답글들을 작성 순서대로 붙입니다.
 * 입력은 작성 순서(id 오름차순)라고 가정합니다. 부모를 찾지 못한 답글은 최상위로 둡니다.
 */
export const orderThreadComments = (comments: PinThreadComment[]): OrderedThreadComment[] => {
  const byId = new Map(comments.map((comment) => [comment.id, comment]));

  const findRootId = (comment: PinThreadComment) => {
    const visited = new Set<string>();
    let current = comment;
    while (current.parentId && !visited.has(current.id)) {
      visited.add(current.id);
      const parent = byId.get(current.parentId);
      if (!parent) break;
      current = parent;
    }
    return current.id;
  };

  const roots: PinThreadComment[] = [];
  const replies = new Map<string, PinThreadComment[]>();
  for (const comment of comments) {
    const rootId = findRootId(comment);
    if (rootId === comment.id) {
      roots.push(comment);
    } else {
      replies.set(rootId, [...(replies.get(rootId) ?? []), comment]);
    }
  }

  return roots.flatMap((root) => [
    { ...root, depth: 0 as const },
    ...(replies.get(root.id) ?? []).map((reply) => ({ ...reply, depth: 1 as const })),
  ]);
};
