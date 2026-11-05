export interface Message {
  id: string;
  authorName: string;
  /** 내 메시지는 오른쪽에 둡니다. */
  isMine?: boolean;
  authorAvatarUrl?: string;
  content: string;
  /** AI 쉬운 설명. 있으면 원문과 함께 보여 줍니다. */
  plainText?: string | null;
  timeLabel: string;
}
