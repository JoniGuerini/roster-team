import type { ReactNode } from 'react';

interface PageToolbarHeadProps {
  titulo: string;
  quantidade: number;
  rotuloSingular: string;
  rotuloPlural: string;
  /** Total sem filtro — exibe "de N" quando informado. */
  total?: number;
  children?: ReactNode;
}

export function PageToolbarHead({
  titulo,
  quantidade,
  rotuloSingular,
  rotuloPlural,
  total,
  children,
}: PageToolbarHeadProps) {
  const rotulo = quantidade === 1 ? rotuloSingular : rotuloPlural;

  return (
    <div className="brisa-page__toolbar-head">
      <div className="brisa-page__toolbar-head-main">
        <h2 className="brisa-page__toolbar-title">{titulo}</h2>
        <p className="brisa-page__toolbar-count" aria-live="polite">
          <span className="brisa-page__toolbar-count-value">{quantidade}</span>
          <span className="brisa-page__toolbar-count-label">{rotulo}</span>
          {total !== undefined && total > 0 ? (
            <span className="brisa-page__toolbar-count-total">de {total}</span>
          ) : null}
        </p>
      </div>
      {children ? (
        <div className="brisa-page__toolbar-actions">{children}</div>
      ) : null}
    </div>
  );
}
