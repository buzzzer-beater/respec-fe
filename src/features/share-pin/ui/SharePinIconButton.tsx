'use client';

import { Icon, IconButton, toast } from '@/shared/ui';

import { useSharePin } from '../api/share-pin';

interface SharePinIconButtonProps {
  projectId: number;
  pinId: number;
  pinNumber: number;
  /** 공유한 뒤(채팅 서랍 열기 등) */
  onShared?: () => void;
}

/** 요청 상세 머리글의 "채팅에 공유" 아이콘 버튼. 핀을 카드로 채팅에 올립니다. */
const SharePinIconButton = ({ projectId, pinId, pinNumber, onShared }: SharePinIconButtonProps) => {
  const sharePin = useSharePin(projectId);

  return (
    <IconButton
      aria-label="채팅에 공유"
      title="채팅에 공유"
      disabled={sharePin.isPending}
      onClick={() =>
        sharePin.mutate(pinId, {
          onSuccess: () => {
            toast(`핀 ${pinNumber}을 채팅에 공유했어요`);
            onShared?.();
          },
          onError: () => toast('공유하지 못했어요. 다시 시도해 주세요.'),
        })
      }
    >
      <Icon name="send" size={16} />
    </IconButton>
  );
};

export default SharePinIconButton;
