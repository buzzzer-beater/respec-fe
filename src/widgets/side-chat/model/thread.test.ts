import { describe, expect, it } from 'vitest';

import { orderThreadComments } from './thread';
import type { PinThreadComment } from './types';

const comment = (id: string, parentId: string | null = null): PinThreadComment => ({
  id,
  parentId,
  authorName: '나',
  authorRole: 'client',
  content: id,
  timeLabel: '',
});

const order = (comments: PinThreadComment[]) =>
  orderThreadComments(comments).map(({ id, depth }) => `${id}:${depth}`);

describe('orderThreadComments', () => {
  it('최상위 댓글은 작성 순서를 그대로 둔다', () => {
    expect(order([comment('1'), comment('2'), comment('3')])).toEqual(['1:0', '2:0', '3:0']);
  });

  it('답글을 부모 댓글 바로 아래에 작성 순서대로 붙인다', () => {
    expect(
      order([comment('1'), comment('2'), comment('3', '1'), comment('4', '2'), comment('5', '1')]),
    ).toEqual(['1:0', '3:1', '5:1', '2:0', '4:1']);
  });

  it('답글의 답글은 최상위 댓글 아래에 한 단계만 들여쓴다', () => {
    expect(order([comment('1'), comment('2', '1'), comment('3', '2')])).toEqual([
      '1:0',
      '2:1',
      '3:1',
    ]);
  });

  it('부모를 찾지 못한 답글은 최상위로 둔다', () => {
    expect(order([comment('1'), comment('2', '99')])).toEqual(['1:0', '2:0']);
  });
});
