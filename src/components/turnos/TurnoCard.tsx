import type { ReactNode } from 'react';
import {
  ROTULO_DIA_SEMANA_RECORRENTE,
  type DiaSemanaRecorrente,
  type Turno,
} from '../../types/turno';
import { labelCategoria } from '../../utils/turnoLabels';
import { labelLocal } from '../../utils/funcionarioLabels';
import './TurnoCard.css';

export type TurnoCardStatusKey =
  | 'completo'
  | 'parcial'
  | 'vazio'
  | 'alerta';

export interface TurnoCardStatus {
  key: TurnoCardStatusKey;
  texto: string;
}

export interface TurnoCardProps {
  turno: Turno;
  status: TurnoCardStatus;
  /** Ações no canto (ex.: editar / excluir na tela de turnos). */
  headActions?: ReactNode;
  /** Na escala: cartão inteiro abre o turno do dia. */
  onCardClick?: () => void;
}

export function TurnoCard({
  turno,
  status,
  headActions,
  onCardClick,
}: TurnoCardProps) {
  const className = [
    'brisa-turno-card',
    turno.ativo ? '' : 'brisa-turno-card--inactive',
  ]
    .filter(Boolean)
    .join(' ');

  const body = (
    <>
      <div className="brisa-turno-card__head">
        <h3 className="brisa-turno-card__title">{turno.nome}</h3>
        {headActions ? (
          <div className="brisa-turno-card__actions">{headActions}</div>
        ) : null}
      </div>

      <ul className="brisa-turno-card__lines">
        <li className="brisa-turno-card__line">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <polyline points="12 7 12 12 15 14" />
          </svg>
          {turno.horaInicio} – {turno.horaFim}
        </li>
        <li className="brisa-turno-card__line">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {labelLocal(turno.localTrabalho)}
        </li>
        <li className="brisa-turno-card__line">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {labelCategoria(turno.categoria)}
        </li>
        {turno.tipo === 'regular' &&
          turno.diaSemanaRecorrente != null &&
          turno.diaSemanaRecorrente >= 0 &&
          turno.diaSemanaRecorrente <= 6 && (
            <li className="brisa-turno-card__line brisa-turno-card__line--accent">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              {
                ROTULO_DIA_SEMANA_RECORRENTE[
                  turno.diaSemanaRecorrente as DiaSemanaRecorrente
                ]
              }
              {' · '}
              <span className="brisa-turno-card__rec-automatica">na escala</span>
            </li>
          )}
      </ul>

      <footer
        className={`brisa-turno-card__status brisa-turno-card__status--${status.key}`}
      >
        <span className="brisa-turno-card__status-dot" aria-hidden="true" />
        {status.texto}
      </footer>
    </>
  );

  if (onCardClick) {
    return (
      <button
        type="button"
        className={className}
        onClick={onCardClick}
        aria-label={`Abrir turno ${turno.nome}`}
      >
        {body}
      </button>
    );
  }

  return <article className={className}>{body}</article>;
}
