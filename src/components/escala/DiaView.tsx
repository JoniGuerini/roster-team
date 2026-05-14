import type { EscalaDia } from '../../types/escala';
import type { Funcionario } from '../../types/funcionario';
import type { PessoaExtra } from '../../types/pessoaExtra';
import type { Turno } from '../../types/turno';
import { Button } from '../ui/Button';
import { TurnoCard } from '../turnos/TurnoCard';
import { AlocacoesTabela } from './AlocacoesTabela';
import { rotuloDataLonga } from '../../utils/datas';
import { calcularStatusTurnoEscaladoNoDia } from '../../utils/statusTurnoEscalado';
import './DiaView.css';

interface DiaViewProps {
  data: string;
  escala: EscalaDia;
  turnos: Turno[];
  funcionarios: Funcionario[];
  extras: PessoaExtra[];
  onAdicionar: () => void;
  onAbrirTurno: (turnoEscaladoId: string) => void;
}

export function DiaView({
  data,
  escala,
  turnos,
  funcionarios,
  extras,
  onAdicionar,
  onAbrirTurno,
}: DiaViewProps) {
  const turnosOrdenados = [...escala.turnos].sort((a, b) => {
    const ta = turnos.find((t) => t.id === a.turnoId)?.horaInicio ?? '';
    const tb = turnos.find((t) => t.id === b.turnoId)?.horaInicio ?? '';
    return ta.localeCompare(tb);
  });

  return (
    <div className="brisa-dia">
      <header className="brisa-dia__header">
        <div>
          <span className="brisa-dia__eyebrow">Dia</span>
          <h2 className="brisa-dia__title">{rotuloDataLonga(data)}</h2>
          <p className="brisa-dia__subtitle">
            {turnosOrdenados.length === 0
              ? 'Nenhum turno escalado para este dia.'
              : `${turnosOrdenados.length} ${turnosOrdenados.length === 1 ? 'turno escalado' : 'turnos escalados'}.`}
          </p>
        </div>
        <Button
          onClick={onAdicionar}
          leftIcon={
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          }
        >
          Adicionar turno
        </Button>
      </header>

      {turnosOrdenados.length === 0 ? (
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
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <h3 className="brisa-empty__title">Nada agendado por aqui</h3>
          <p className="brisa-empty__hint">
            Clique em <strong>Adicionar turno</strong> para escalar um modelo
            de turno neste dia.
          </p>
        </div>
      ) : (
        <>
          <div className="brisa-dia__grid">
            {turnosOrdenados.map((te) => {
              const turno = turnos.find((t) => t.id === te.turnoId);
              if (!turno) return null;
              const status = calcularStatusTurnoEscaladoNoDia(
                data,
                turno,
                te,
                funcionarios,
              );
              return (
                <TurnoCard
                  key={te.id}
                  turno={turno}
                  status={status}
                  onCardClick={() => onAbrirTurno(te.id)}
                />
              );
            })}
          </div>

          <AlocacoesTabela
            data={data}
            escala={escala}
            turnos={turnos}
            funcionarios={funcionarios}
            extras={extras}
          />
        </>
      )}
    </div>
  );
}
