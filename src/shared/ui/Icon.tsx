import { createElement, type SVGProps } from 'react';

import { ICON_SHAPES } from './icon-shapes';

export type IconName = keyof typeof ICON_SHAPES;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  /** px. 기본 18 */
  size?: number;
}

/** demo-design의 선 아이콘. 글자색(`currentColor`)을 따르고 화면 읽기에서는 숨깁니다. */
export const Icon = ({ name, size = 18, className, ...props }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    className={className ? `shrink-0 ${className}` : 'shrink-0'}
    {...props}
  >
    {ICON_SHAPES[name].map(([tag, attrs], index) => createElement(tag, { key: index, ...attrs }))}
  </svg>
);
