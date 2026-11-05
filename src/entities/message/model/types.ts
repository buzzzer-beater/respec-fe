export interface Message {
  id: string;
  authorName: string;
  authorAvatarUrl?: string;
  content: string;
  timeLabel: string;
  replies?: Message[];
}
