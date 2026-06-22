import type { ReactNode } from 'react';
import {
  isRecorrenciaEscala,
  rotuloRecorrenciaEscala,
  type Turno,
} from '../../types/turno';
import { labelCategoria } from '../../utils/turnoLabels';
import { labelLocal } from '../../utils/funcionarioLabels';
import { Icon } from '../ui/Icon';
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
          <Icon name="clock" size={13} />
          {turno.horaInicio} – {turno.horaFim}
        </li>
        <li className="brisa-turno-card__line">
          <Icon name="map-pin" size={13} />
          {labelLocal(turno.localTrabalho)}
        </li>
        <li className="brisa-turno-card__line">
          <Icon name="calendar" size={13} />
          {labelCategoria(turno.categoria)}
        </li>
        {turno.tipo === 'regular' &&
          isRecorrenciaEscala(turno.diaSemanaRecorrente) && (
            <li className="brisa-turno-card__line brisa-turno-card__line--accent">
              <Icon name="repeat" size={13} />
              {rotuloRecorrenciaEscala(turno.diaSemanaRecorrente)}
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
