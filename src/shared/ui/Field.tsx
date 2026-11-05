import type { ComponentProps } from 'react';

import { cn } from '@/shared/lib';

const fieldClassName =
  'border-field text-ink placeholder:text-faint focus:border-ink aria-invalid:border-warn w-full rounded-xl border px-3.5 text-[15px] outline-none';

/** 한 줄 입력창. 오류일 때 `aria-invalid`를 주면 테두리가 바뀝니다. */
export const Input = ({ className, ...props }: ComponentProps<'input'>) => (
  <input className={cn(fieldClassName, 'h-12', className)} {...props} />
);

/** 여러 줄 입력창. 높이를 내용에 맞추려면 `field-sizing-content`와 `max-h-*`를 함께 넘기세요. */
export const Textarea = ({ className, ...props }: ComponentProps<'textarea'>) => (
  <textarea
    className={cn(fieldClassName, 'resize-none py-3 leading-normal', className)}
    {...props}
  />
);
