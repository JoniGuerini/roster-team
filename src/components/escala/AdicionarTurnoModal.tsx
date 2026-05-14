import { useMemo, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { EscalaDia } from '../../types/escala';
import {
  ROTULO_DIA_SEMANA_RECORRENTE,
  type DiaSemanaRecorrente,
  type Turno,
} from '../../types/turno';
import { labelLocal } from '../../utils/funcionarioLabels';
import { labelCategoria } from '../../utils/turnoLabels';
import { diaSemanaDe, rotuloDataLonga } from '../../utils/datas';
import './AdicionarTurnoModal.css';

interface AdicionarTurnoModalProps {
  open: boolean;
  data: string;
  escalaDoDia: EscalaDia;
  turnos: Turno[];
  onCancel: () => void;
  onConfirmar: (turnoId: string) => void;
}

export function AdicionarTurnoModal({
  open,
  data,
  escalaDoDia,
  turnos,
  onCancel,
  onConfirmar,
}: AdicionarTurnoModalProps) {
  const [busca, setBusca] = useState('');
  const [selecionado, setSelecionado] = useState<string | null>(null);

  const idsJaUsados = useMemo(
    () => new Set(escalaDoDia.turnos.map((te) => te.turnoId)),
    [escalaDoDia],
  );

  const turnosAtivos = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return turnos
      .filter((t) => t.ativo)
      .filter(
        (t) =>
          !termo ||
          t.nome.toLowerCase().includes(termo) ||
          t.localTrabalho.toLowerCase().includes(termo),
      );
  }, [turnos, busca]);

  function fechar() {
    setSelecionado(null);
    setBusca('');
    onCancel();
  }

  function confirmar() {
    if (!selecionado) return;
    onConfirmar(selecionado);
    setSelecionado(null);
    setBusca('');
  }

  return (
    <Modal
      open={open}
      onClose={fechar}
      title="Adicionar turno ao dia"
      description={`Escolha o modelo de turno para ${rotuloDataLonga(data)}.`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={fechar}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={confirmar}
            disabled={!selecionado}
          >
            Adicionar turno
          </Button>
        </>
      }
    >
      <div className="brisa-add-turno">
        <div className="brisa-search">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <Input
            placeholder="Buscar turno por nome ou local…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {turnosAtivos.length === 0 ? (
          <div className="brisa-form__empty">
            {turnos.length === 0
              ? 'Nenhum turno-modelo cadastrado. Crie em "Turnos" antes.'
              : 'Nenhum turno encontrado com esse termo.'}
          </div>
        ) : (
          <ul className="brisa-add-turno__list">
            {turnosAtivos.map((t) => {
              const jaUsado = idsJaUsados.has(t.id);
              const ativo = selecionado === t.id;
              const diaRecorrente =
                t.tipo === 'regular' &&
                t.diaSemanaRecorrente != null &&
                t.diaSemanaRecorrente >= 0 &&
                t.diaSemanaRecorrente <= 6
                  ? ROTULO_DIA_SEMANA_RECORRENTE[
                      t.diaSemanaRecorrente as DiaSemanaRecorrente
                    ]
                  : null;
              const encaixaNoDia =
                diaRecorrente != null &&
                diaSemanaDe(data) === t.diaSemanaRecorrente;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    className={`brisa-add-turno__item ${ativo ? 'brisa-add-turno__item--active' : ''}`}
                    onClick={() => setSelecionado(t.id)}
                  >
                    <div className="brisa-add-turno__head">
                      <h4 className="brisa-add-turno__nome">{t.nome}</h4>
                      {jaUsado && (
                        <span className="brisa-add-turno__tag">Já no dia</span>
                      )}
                    </div>

                    <ul className="brisa-add-turno__lines">
                      <li className="brisa-add-turno__line">
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
                        {t.horaInicio} – {t.horaFim}
                      </li>
                      <li className="brisa-add-turno__line">
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
                        {labelLocal(t.localTrabalho)}
                      </li>
                      <li className="brisa-add-turno__line">
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
                        {labelCategoria(t.categoria)}
                      </li>
                      {diaRecorrente && (
                        <li className="brisa-add-turno__line brisa-add-turno__line--muted">
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
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                          </svg>
                          {diaRecorrente}
                          {encaixaNoDia ? (
                            <span className="brisa-add-turno__rec-badge">
                              {' '}
                              · já entra sozinho neste dia
                            </span>
                          ) : (
                            <span className="brisa-add-turno__rec-badge">
                              {' '}
                              · adição extra neste dia
                            </span>
                          )}
                        </li>
                      )}
                    </ul>

                    {ativo && (
                      <span
                        className="brisa-add-turno__check"
                        aria-hidden="true"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}
