import { type Message, MessageItem } from '@/entities/message';

interface ChatMessageListProps {
  messages: Message[];
}

// 답글 연결선: 부모 아바타 아래(x=26)에서 내려와 답글 아바타 중심 높이에서 꺾입니다.
const ELBOW =
  'before:border-line before:absolute before:-top-7 before:-left-[23px] before:h-[52px] before:w-[23px] before:rounded-bl-[20px] before:border-b before:border-l';
const TRUNK =
  'not-last:after:bg-line not-last:after:absolute not-last:after:inset-y-0 not-last:after:-left-[23px] not-last:after:w-px';

const ChatMessageList = ({ messages }: ChatMessageListProps) => {
  return (
    <ul className="flex w-full flex-col gap-7 px-7">
      {messages.map(({ id, replies = [], ...message }) => (
        <li key={id} className="flex flex-col gap-7">
          <MessageItem {...message} />
          {replies.length > 0 && (
            <ul className="flex flex-col gap-7 pl-[49px]">
              {replies.map((reply) => (
                <li key={reply.id} className={`relative ${ELBOW} ${TRUNK}`}>
                  <MessageItem {...reply} variant="reply" />
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
};

export default ChatMessageList;
