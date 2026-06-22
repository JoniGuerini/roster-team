import type { ReactNode } from 'react';
import './EmptyState.css';

interface EmptyStateProps {
  children: ReactNode;
  /** Sem card externo — para contextos embutidos (ex.: detalhe da empresa). */
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  children,
  compact = false,
  className,
}: EmptyStateProps) {
  if (compact) {
    return (
      <div
        className={['brisa-empty brisa-empty--compacto', className]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={['brisa-empty-shell', className].filter(Boolean).join(' ')}
    >
      <div className="brisa-empty">{children}</div>
    </div>
  );
}
