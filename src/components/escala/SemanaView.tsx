import type { EscalaDia } from '../../types/escala';
import type { Funcionario } from '../../types/funcionario';
import type { PessoaExtra } from '../../types/pessoaExtra';
import type { Turno } from '../../types/turno';
import { diasDaSemana } from '../../utils/datas';
import { TimeGridEscala } from './TimeGridEscala';
import './SemanaView.css';

interface SemanaViewProps {
  data: string;
  escalas: EscalaDia[];
  turnos: Turno[];
  funcionarios: Funcionario[];
  extras: PessoaExtra[];
  onAdicionar?: (data: string) => void;
  onAbrirTurno?: (data: string, turnoEscaladoId: string) => void;
  onAbrirDia: (data: string) => void;
}

export function SemanaView({
  data,
  escalas,
  turnos,
  funcionarios,
  extras,
  onAdicionar,
  onAbrirTurno,
  onAbrirDia,
}: SemanaViewProps) {
  const dias = diasDaSemana(data);
  const escalasPorData = new Map<string, EscalaDia>();
  for (const e of escalas) escalasPorData.set(e.data, e);

  return (
    <div className="brisa-semana">
      <TimeGridEscala
        dias={dias}
        dataSelecionada={data}
        escalasPorData={escalasPorData}
        turnos={turnos}
        funcionarios={funcionarios}
        extras={extras}
        onAbrirDia={onAbrirDia}
        onAbrirTurno={onAbrirTurno}
        onAdicionar={onAdicionar}
      />
    </div>
  );
}
