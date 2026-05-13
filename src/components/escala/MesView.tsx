import type { EscalaDia } from '../../types/escala';
import type { Funcionario } from '../../types/funcionario';
import type { Turno } from '../../types/turno';
import {
  NOMES_DIAS_CURTOS,
  diasDoMesGrade,
  ehHoje,
  ehMesmoMes,
  fromISO,
} from '../../utils/datas';
import {
  indisponibilidadeNoDia,
  pessoasAlocadas,
  vagasEmFaltaNoTurno,
} from '../../utils/disponibilidade';
import './MesView.css';

interface MesViewProps {
  data: string;
  escalas: EscalaDia[];
  turnos: Turno[];
  funcionarios: Funcionario[];
  onAbrirDia: (data: string) => void;
}

interface ResumoDia {
  total: number;
  alertas: number;
}

function calcularResumo(
  escala: EscalaDia,
  turnos: Turno[],
  funcionarios: Funcionario[],
  data: string,
): ResumoDia {
  let alertas = 0;
  for (const te of escala.turnos) {
    const turno = turnos.find((t) => t.id === te.turnoId);
    if (!turno) continue;
    const idsAlocados = pessoasAlocadas(te);
    const faltamVagas = vagasEmFaltaNoTurno(turno, te);
    const algumIndisp = idsAlocados.some((id) => {
      const f = funcionarios.find((x) => x.id === id);
      return f ? indisponibilidadeNoDia(f, data) !== null : false;
    });
    if (algumIndisp || faltamVagas > 0) {
      alertas += 1;
    }
  }
  return { total: escala.turnos.length, alertas };
}

export function MesView({
  data,
  escalas,
  turnos,
  funcionarios,
  onAbrirDia,
}: MesViewProps) {
  const dias = diasDoMesGrade(data);
  const escalasPorData = new Map<string, EscalaDia>();
  for (const e of escalas) escalasPorData.set(e.data, e);

  return (
    <div className="brisa-mes">
      <div className="brisa-mes__cabecalho">
        {NOMES_DIAS_CURTOS.map((nome) => (
          <span key={nome} className="brisa-mes__dia-label">
            {nome}
          </span>
        ))}
      </div>

      <div className="brisa-mes__grid">
        {dias.map((dia) => {
          const noMes = ehMesmoMes(dia, data);
          const eHoje = ehHoje(dia);
          const escala = escalasPorData.get(dia);
          const resumo = escala
            ? calcularResumo(escala, turnos, funcionarios, dia)
            : { total: 0, alertas: 0 };
          const dataObj = fromISO(dia);

          return (
            <button
              key={dia}
              type="button"
              className={[
                'brisa-mes__cell',
                noMes ? '' : 'brisa-mes__cell--fora',
                eHoje ? 'brisa-mes__cell--hoje' : '',
                resumo.alertas > 0 ? 'brisa-mes__cell--alerta' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onAbrirDia(dia)}
            >
              <span className="brisa-mes__num">{dataObj.getDate()}</span>
              {resumo.total > 0 && (
                <span className="brisa-mes__badge">
                  {resumo.total}
                  {resumo.alertas > 0 && (
                    <span
                      className="brisa-mes__badge-alerta"
                      title={`${resumo.alertas} ${resumo.alertas === 1 ? 'turno com alerta' : 'turnos com alertas'}`}
                    />
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
