import type { ReactNode } from 'react';
import './Badge.css';

type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', children }: BadgeProps) {
  return <span className={`brisa-badge brisa-badge--${tone}`}>{children}</span>;
}
