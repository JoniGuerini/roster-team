import type { TurnoEscalado } from '../../types/escala';
import type { Funcionario } from '../../types/funcionario';
import type { PessoaExtra } from '../../types/pessoaExtra';
import type { Turno } from '../../types/turno';
import { calcularStatusTurnoEscaladoNoDia } from '../../utils/statusTurnoEscalado';
import { labelTipo } from '../../utils/turnoLabels';
import './TurnoEscaladoCard.css';

interface TurnoEscaladoCardProps {
  data: string;
  turnoEscalado: TurnoEscalado;
  turno: Turno;
  funcionarios: Funcionario[];
  extras: PessoaExtra[];
  onClick?: () => void;
}

export function TurnoEscaladoCard({
  data,
  turnoEscalado,
  turno,
  funcionarios,
  extras: _extras,
  onClick,
}: TurnoEscaladoCardProps) {
  const status = calcularStatusTurnoEscaladoNoDia(
    data,
    turno,
    turnoEscalado,
    funcionarios,
  );

  const mostrarTipo = turno.tipo !== 'regular';

  return (
    <button
      type="button"
      className="brisa-turno-esc brisa-turno-esc--compacto"
      onClick={onClick}
    >
      <h4 className="brisa-turno-esc__nome" title={turno.nome}>
        {turno.nome}
      </h4>

      <span className="brisa-turno-esc__hora">
        {turno.horaInicio} – {turno.horaFim}
      </span>

      <div
        className={`brisa-turno-esc__status brisa-turno-esc__status--${status.key}`}
      >
        <span className="brisa-turno-esc__status-dot" aria-hidden="true" />
        <span className="brisa-turno-esc__status-texto">{status.texto}</span>
      </div>

      {mostrarTipo && (
        <div className="brisa-turno-esc__meta">
          <span
            className={`brisa-turno-esc__tipo brisa-turno-esc__tipo--${turno.tipo}`}
          >
            {labelTipo(turno.tipo)}
          </span>
        </div>
      )}
    </button>
  );
}
