import type { EscalaDia } from '../../types/escala';
import type { Funcionario } from '../../types/funcionario';
import type { PessoaExtra } from '../../types/pessoaExtra';
import type { Turno } from '../../types/turno';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
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
        <Button onClick={onAdicionar} leftIcon={<Icon name="plus" size={14} />}>
          Adicionar turno
        </Button>
      </header>

      {turnosOrdenados.length === 0 ? (
        <div className="brisa-empty">
          <div className="brisa-empty__icon">
            <Icon name="calendar-event" size={36} />
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
