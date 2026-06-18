import type { EscalaDia, TurnoEscalado } from '../../types/escala';
import type { Funcionario } from '../../types/funcionario';
import type { PessoaExtra } from '../../types/pessoaExtra';
import type { Turno } from '../../types/turno';
import {
  NOMES_DIAS_CURTOS,
  diasDaSemana,
  ehHoje,
  fromISO,
} from '../../utils/datas';
import { TurnoEscaladoCard } from './TurnoEscaladoCard';
import { Icon } from '../ui/Icon';
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
      {dias.map((dia) => {
        const escala = escalasPorData.get(dia);
        const dataObj = fromISO(dia);
        const eHoje = ehHoje(dia);
        return (
          <div
            key={dia}
            className={`brisa-semana__col ${eHoje ? 'brisa-semana__col--hoje' : ''}`}
          >
            <header
              className="brisa-semana__col-header"
              onClick={() => onAbrirDia(dia)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onAbrirDia(dia);
              }}
            >
              <span className="brisa-semana__col-dia-nome">
                {NOMES_DIAS_CURTOS[dataObj.getDay()]}
              </span>
              <span className="brisa-semana__col-dia-num">
                {dataObj.getDate()}
              </span>
            </header>

            <div className="brisa-semana__col-body">
              {(escala?.turnos ?? []).map((te: TurnoEscalado) => {
                const turno = turnos.find((t) => t.id === te.turnoId);
                if (!turno) return null;
                return (
                  <TurnoEscaladoCard
                    key={te.id}
                    data={dia}
                    turnoEscalado={te}
                    turno={turno}
                    funcionarios={funcionarios}
                    extras={extras}
                    onClick={
                      onAbrirTurno ? () => onAbrirTurno(dia, te.id) : undefined
                    }
                  />
                );
              })}
              {onAdicionar ? (
                <button
                  type="button"
                  className="brisa-semana__add"
                  onClick={() => onAdicionar(dia)}
                >
                  <Icon name="plus" size={14} />
                  Turno
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
