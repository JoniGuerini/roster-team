import type { EscalaDia, TurnoEscalado } from '../../types/escala';
import type { Funcionario } from '../../types/funcionario';
import type { PessoaExtra } from '../../types/pessoaExtra';
import type { Turno } from '../../types/turno';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { fromISO } from '../../utils/datas';
import { calcularStatusTurnoEscaladoNoDia } from '../../utils/statusTurnoEscalado';
import type { StatusTurnoEscaladoKey } from '../../utils/statusTurnoEscalado';
import './EscalaDiaPainel.css';

interface EscalaDiaPainelProps {
  data: string;
  escala: EscalaDia;
  turnos: Turno[];
  funcionarios: Funcionario[];
  extras: PessoaExtra[];
  onAdicionar?: () => void;
  onAbrirTurno?: (turnoEscaladoId: string) => void;
}

function classeListaStatus(key: StatusTurnoEscaladoKey): string {
  return `brisa-escala-dia-painel__item--${key}`;
}

export function EscalaDiaPainel({
  data,
  escala,
  turnos,
  funcionarios,
  extras,
  onAdicionar,
  onAbrirTurno,
}: EscalaDiaPainelProps) {
  const dataObj = fromISO(data);

  const turnosOrdenados = [...escala.turnos]
    .map((te) => {
      const turno = turnos.find((t) => t.id === te.turnoId);
      return turno ? { te, turno } : null;
    })
    .filter(Boolean) as { te: TurnoEscalado; turno: Turno }[];

  turnosOrdenados.sort((a, b) =>
    a.turno.horaInicio.localeCompare(b.turno.horaInicio),
  );

  const diaSemana = dataObj
    .toLocaleDateString('pt-BR', { weekday: 'long' })
    .replace(/^\w/, (c) => c.toUpperCase());
  const mes = dataObj
    .toLocaleDateString('pt-BR', { month: 'long' })
    .replace(/^\w/, (c) => c.toUpperCase());

  return (
    <aside className="brisa-escala-card brisa-escala-card--sidebar brisa-escala-dia-painel">
      <div className="brisa-escala-dia-painel__head">
        <span className="brisa-escala-dia-painel__weekday">{diaSemana}</span>
        <div className="brisa-escala-dia-painel__date-row">
          <span className="brisa-escala-dia-painel__day-num">
            {dataObj.getDate()}
          </span>
          <span className="brisa-escala-dia-painel__month">{mes}</span>
          <Badge tone="neutral">
            {turnosOrdenados.length}{' '}
            {turnosOrdenados.length === 1 ? 'turno' : 'turnos'}
          </Badge>
        </div>
      </div>

      <div className="brisa-escala-dia-painel__divider" />

      <div className="brisa-escala-dia-painel__list">
        {turnosOrdenados.length === 0 ? (
          <p className="brisa-escala-dia-painel__empty">
            Nenhum turno neste dia.
          </p>
        ) : (
          turnosOrdenados.map(({ te, turno }) => {
            const status = calcularStatusTurnoEscaladoNoDia(
              data,
              turno,
              te,
              funcionarios,
              extras,
            );
            return (
              <button
                key={te.id}
                type="button"
                className={`brisa-escala-dia-painel__item ${classeListaStatus(status.key)}`}
                onClick={() => onAbrirTurno?.(te.id)}
              >
                <span className="brisa-escala-dia-painel__item-nome">
                  {turno.nome}
                </span>
                <span className="brisa-escala-dia-painel__item-hora">
                  <Icon name="clock" size={12} />
                  {turno.horaInicio} – {turno.horaFim}
                </span>
                <span className="brisa-escala-dia-painel__item-status">
                  {status.texto}
                </span>
              </button>
            );
          })
        )}
      </div>

      {onAdicionar ? (
        <div className="brisa-escala-dia-painel__footer">
          <Button
            fullWidth
            size="sm"
            onClick={onAdicionar}
            leftIcon={<Icon name="plus" size={14} />}
          >
            Adicionar turno
          </Button>
        </div>
      ) : null}
    </aside>
  );
}
