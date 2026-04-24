import type { EscalaDia, TurnoEscalado } from '../../types/escala';
import type { Funcionario } from '../../types/funcionario';
import type { Turno } from '../../types/turno';
import {
  NOMES_DIAS_CURTOS,
  diasDaSemana,
  ehHoje,
  fromISO,
} from '../../utils/datas';
import { TurnoEscaladoCard } from './TurnoEscaladoCard';
import './SemanaView.css';

interface SemanaViewProps {
  data: string;
  escalas: EscalaDia[];
  turnos: Turno[];
  funcionarios: Funcionario[];
  onAdicionar: (data: string) => void;
  onAbrirTurno: (data: string, turnoEscaladoId: string) => void;
  onAbrirDia: (data: string) => void;
}

export function SemanaView({
  data,
  escalas,
  turnos,
  funcionarios,
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
                    variant="compacto"
                    onClick={() => onAbrirTurno(dia, te.id)}
                  />
                );
              })}
              <button
                type="button"
                className="brisa-semana__add"
                onClick={() => onAdicionar(dia)}
              >
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
                Turno
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
