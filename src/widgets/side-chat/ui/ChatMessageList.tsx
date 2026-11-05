import { type Message, MessageItem } from '@/entities/message';

interface ChatMessageListProps {
  messages: Message[];
}

const ChatMessageList = ({ messages }: ChatMessageListProps) => {
  if (messages.length === 0) {
    return <p className="text-muted px-9 py-7 text-sm">아직 나눈 대화가 없어요.</p>;
  }

  return (
    <ul className="flex w-full flex-col gap-5 px-9 py-7">
      {messages.map(({ id, ...message }) => (
        <li key={id} className="flex flex-col">
          <MessageItem {...message} />
        </li>
      ))}
    </ul>
  );
};

export default ChatMessageList;
