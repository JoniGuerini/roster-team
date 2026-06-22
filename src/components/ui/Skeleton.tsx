import type { CSSProperties } from 'react';
import './Skeleton.css';

type SkeletonRounded = 'sm' | 'md' | 'lg' | 'xl' | 'pill' | 'full';

interface SkeletonProps {
  className?: string;
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  rounded?: SkeletonRounded;
  /** Para barras sobre fundo escuro (sidebar, header da tabela). */
  onDark?: boolean;
}

export function Skeleton({
  className = '',
  width = '100%',
  height = 14,
  rounded = 'md',
  onDark = false,
}: SkeletonProps) {
  const classes = [
    'brisa-skeleton',
    `brisa-skeleton--${rounded}`,
    onDark ? 'brisa-skeleton--on-dark' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={classes}
      aria-hidden="true"
      style={{ width, height }}
    />
  );
}
