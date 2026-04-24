import { useMemo } from 'react';
import { TIPOS_TURNO, type TipoTurno, type Turno } from '../../types/turno';
import type { Funcionario } from '../../types/funcionario';
import { labelCategoria } from '../../utils/turnoLabels';
import { labelLocal } from '../../utils/funcionarioLabels';
import './TurnosList.css';

interface TurnosListProps {
  turnos: Turno[];
  funcionarios: Funcionario[];
  onEdit: (turno: Turno) => void;
  onDelete: (turno: Turno) => void;
}

const TITULOS_GRUPO: Record<TipoTurno, string> = {
  regular: 'Turnos regulares',
  feriado: 'Turnos de feriado',
  especial: 'Turnos especiais',
};

const DESCRICOES_GRUPO: Record<TipoTurno, string> = {
  regular: 'Aplicados no dia a dia da cafeteria.',
  feriado: 'Usados em feriados ou datas comemorativas.',
  especial: 'Eventos pontuais, como festas e ocasiões especiais.',
};

interface StatusSugeridos {
  key: 'completo' | 'parcial' | 'vazio';
  texto: string;
}

function calcularStatusSugeridos(turno: Turno): StatusSugeridos {
  const totalNec = turno.necessidades.reduce(
    (acc, n) => acc + n.quantidade,
    0,
  );
  const totalSug = turno.funcionariosSugeridos.length;

  if (totalNec === 0) {
    return { key: 'completo', texto: 'Sem necessidade definida' };
  }
  if (totalSug === 0) {
    return { key: 'vazio', texto: 'Nenhum sugerido' };
  }
  if (totalSug >= totalNec) {
    return { key: 'completo', texto: 'Sugeridos completos' };
  }
  const faltam = totalNec - totalSug;
  return {
    key: 'parcial',
    texto: faltam === 1 ? 'Falta 1 sugerido' : `Faltam ${faltam} sugeridos`,
  };
}

export function TurnosList({
  turnos,
  onEdit,
  onDelete,
}: TurnosListProps) {
  const agrupados = useMemo(() => {
    const grupos = new Map<TipoTurno, Turno[]>();
    TIPOS_TURNO.forEach(({ value }) => grupos.set(value, []));
    turnos.forEach((turno) => {
      const lista = grupos.get(turno.tipo) ?? [];
      lista.push(turno);
      grupos.set(turno.tipo, lista);
    });
    return grupos;
  }, [turnos]);

  if (turnos.length === 0) {
    return (
      <div className="brisa-empty">
        <div className="brisa-empty__icon">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <polyline points="12 7 12 12 15 14" />
          </svg>
        </div>
        <h3 className="brisa-empty__title">Nenhum turno cadastrado</h3>
        <p className="brisa-empty__hint">
          Clique em <strong>Novo turno</strong> para criar o primeiro modelo de
          turno da Brisa.
        </p>
      </div>
    );
  }

  return (
    <div className="brisa-turnos-grupos">
      {TIPOS_TURNO.map(({ value }) => {
        const lista = agrupados.get(value) ?? [];
        if (lista.length === 0) return null;

        return (
          <section key={value} className="brisa-turnos-grupo">
            <header className="brisa-turnos-grupo__header">
              <div>
                <h2 className="brisa-turnos-grupo__title">
                  {TITULOS_GRUPO[value]}
                </h2>
                <p className="brisa-turnos-grupo__desc">
                  {DESCRICOES_GRUPO[value]}
                </p>
              </div>
              <span className="brisa-turnos-grupo__count">
                {lista.length} {lista.length === 1 ? 'turno' : 'turnos'}
              </span>
            </header>

            <div className="brisa-turnos-grid">
              {lista.map((turno) => {
                const status = calcularStatusSugeridos(turno);
                return (
                  <article
                    key={turno.id}
                    className={`brisa-turno-card ${turno.ativo ? '' : 'brisa-turno-card--inactive'}`}
                  >
                    <div className="brisa-turno-card__head">
                      <h3 className="brisa-turno-card__title">{turno.nome}</h3>
                      <div className="brisa-turno-card__actions">
                        <button
                          type="button"
                          className="brisa-icon-btn"
                          aria-label={`Editar ${turno.nome}`}
                          title="Ver detalhes / Editar"
                          onClick={() => onEdit(turno)}
                        >
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="brisa-icon-btn brisa-icon-btn--danger"
                          aria-label={`Excluir ${turno.nome}`}
                          title="Excluir"
                          onClick={() => onDelete(turno)}
                        >
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                            <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
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
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {labelCategoria(turno.categoria)}
                      </li>
                    </ul>

                    <footer
                      className={`brisa-turno-card__status brisa-turno-card__status--${status.key}`}
                    >
                      <span className="brisa-turno-card__status-dot" aria-hidden="true" />
                      {status.texto}
                    </footer>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
