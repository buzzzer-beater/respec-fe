import { Button } from '@/shared/ui';

interface ChatButtonProps {
  /** 전체 메시지 수. 읽지 않은 수가 아니라서 회색 배지입니다. */
  count: number;
  isOpen: boolean;
  onClick: () => void;
}

/** 상단바의 "채팅 N" 버튼 (demo-design `.chat-btn`). 누를 때마다 채팅 서랍을 열고 닫습니다. */
const ChatButton = ({ count, isOpen, onClick }: ChatButtonProps) => (
  <Button
    variant="secondary"
    size="sm"
    onClick={onClick}
    aria-expanded={isOpen}
    aria-controls="chat-drawer"
    className="relative"
  >
    채팅
    <span className="bg-chip text-text absolute -top-[5px] -right-1.5 min-w-5 rounded-full px-1.5 py-px text-center text-[11px] font-extrabold">
      {count}
    </span>
  </Button>
);

export default ChatButton;
