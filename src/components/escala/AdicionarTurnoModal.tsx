import { useMemo, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Icon } from '../ui/Icon';
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
          <Icon name="search" size={16} />
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
                        <Icon name="clock" size={13} />
                        {t.horaInicio} – {t.horaFim}
                      </li>
                      <li className="brisa-add-turno__line">
                        <Icon name="map-pin" size={13} />
                        {labelLocal(t.localTrabalho)}
                      </li>
                      <li className="brisa-add-turno__line">
                        <Icon name="calendar" size={13} />
                        {labelCategoria(t.categoria)}
                      </li>
                      {diaRecorrente && (
                        <li className="brisa-add-turno__line brisa-add-turno__line--muted">
                          <Icon name="repeat" size={13} />
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
                        <Icon name="check" size={14} />
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
