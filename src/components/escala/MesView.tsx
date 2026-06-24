import type { EscalaDia } from '../../types/escala';
import type { Funcionario } from '../../types/funcionario';
import type { PessoaExtra } from '../../types/pessoaExtra';
import type { Turno } from '../../types/turno';
import {
  NOMES_DIAS_CURTOS,
  diasDoMesGrade,
  ehHoje,
  ehMesmoMes,
  fromISO,
} from '../../utils/datas';
import { calcularStatusTurnoEscaladoNoDia } from '../../utils/statusTurnoEscalado';
import './MesView.css';

interface MesViewProps {
  data: string;
  dataSelecionada: string;
  escalas: EscalaDia[];
  turnos: Turno[];
  funcionarios: Funcionario[];
  extras: PessoaExtra[];
  onSelecionarDia: (data: string) => void;
}

interface ResumoDia {
  total: number;
  alertas: number;
}

function calcularResumo(
  escala: EscalaDia,
  turnos: Turno[],
  funcionarios: Funcionario[],
  extras: PessoaExtra[],
  data: string,
): ResumoDia {
  let total = 0;
  let alertas = 0;
  for (const te of escala.turnos) {
    const turno = turnos.find((t) => t.id === te.turnoId);
    if (!turno) continue;
    total += 1;
    const status = calcularStatusTurnoEscaladoNoDia(
      data,
      turno,
      te,
      funcionarios,
      extras,
    );
    if (status.key !== 'completo') {
      alertas += 1;
    }
  }
  return { total, alertas };
}

export function MesView({
  data,
  dataSelecionada,
  escalas,
  turnos,
  funcionarios,
  extras,
  onSelecionarDia,
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
          const selecionado = dia === dataSelecionada;
          const escala = escalasPorData.get(dia);
          const resumo = escala
            ? calcularResumo(escala, turnos, funcionarios, extras, dia)
            : { total: 0, alertas: 0 };
          const dataObj = fromISO(dia);

          const numClass = [
            'brisa-mes__num',
            selecionado ? 'brisa-mes__num--selecionado' : '',
            eHoje && !selecionado ? 'brisa-mes__num--hoje' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={dia}
              type="button"
              className={[
                'brisa-mes__cell',
                noMes ? '' : 'brisa-mes__cell--fora',
                selecionado ? 'brisa-mes__cell--selecionada' : '',
                resumo.alertas > 0 ? 'brisa-mes__cell--alerta' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelecionarDia(dia)}
              aria-current={selecionado ? 'date' : undefined}
            >
              <span className={numClass}>{dataObj.getDate()}</span>
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
