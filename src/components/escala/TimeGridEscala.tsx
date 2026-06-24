import { useEffect, useRef } from 'react';
import type { EscalaDia, TurnoEscalado } from '../../types/escala';
import type { Funcionario } from '../../types/funcionario';
import type { PessoaExtra } from '../../types/pessoaExtra';
import type { Turno } from '../../types/turno';
import {
  NOMES_DIAS_CURTOS,
  ehHoje,
  fromISO,
} from '../../utils/datas';
import { calcularStatusTurnoEscaladoNoDia } from '../../utils/statusTurnoEscalado';
import type { StatusTurnoEscaladoKey } from '../../utils/statusTurnoEscalado';
import {
  HOUR_HEIGHT,
  HOURS,
  SCROLL_INICIAL_H,
  alturaTurnoPx,
  formatarHoraGrade,
  horarioToMin,
  topTurnoPx,
} from '../../utils/horarioGrade';
import {
  calcularLayoutSobreposicao,
  estiloBlocoSobreposicao,
} from '../../utils/sobreposicaoGrade';
import { Icon } from '../ui/Icon';
import './TimeGridEscala.css';
import './EscalaAddMini.css';

interface TimeGridEscalaProps {
  dias: string[];
  dataSelecionada: string;
  escalasPorData: Map<string, EscalaDia>;
  turnos: Turno[];
  funcionarios: Funcionario[];
  extras: PessoaExtra[];
  onAbrirDia: (data: string) => void;
  onAbrirTurno?: (data: string, turnoEscaladoId: string) => void;
  onAdicionar?: (data: string) => void;
}

function classeStatus(key: StatusTurnoEscaladoKey): string {
  return `brisa-timegrid__bloco--${key}`;
}

export function TimeGridEscala({
  dias,
  dataSelecionada,
  escalasPorData,
  turnos,
  funcionarios,
  extras,
  onAbrirDia,
  onAbrirTurno,
  onAdicionar,
}: TimeGridEscalaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = SCROLL_INICIAL_H * HOUR_HEIGHT;
  }, [dias.join('|')]);

  const gridCols = { gridTemplateColumns: `repeat(${dias.length}, 1fr)` };

  return (
    <div className="brisa-timegrid">
      <div className="brisa-timegrid__header">
        <div className="brisa-timegrid__gutter" aria-hidden="true" />
        <div className="brisa-timegrid__days" style={gridCols}>
          {dias.map((dia) => {
            const dataObj = fromISO(dia);
            const eHoje = ehHoje(dia);
            const selecionado = dia === dataSelecionada;
            const numClass = [
              'brisa-timegrid__day-num',
              selecionado ? 'brisa-timegrid__day-num--selecionado' : '',
              eHoje && !selecionado ? 'brisa-timegrid__day-num--hoje' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <button
                key={dia}
                type="button"
                className="brisa-timegrid__day-head"
                onClick={() => onAbrirDia(dia)}
                aria-current={selecionado ? 'date' : undefined}
              >
                <span className="brisa-timegrid__day-label">
                  {NOMES_DIAS_CURTOS[dataObj.getDay()]}
                </span>
                <span className={numClass}>{dataObj.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="brisa-timegrid__scroll" ref={scrollRef}>
        <div className="brisa-timegrid__body">
          <div className="brisa-timegrid__hours">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="brisa-timegrid__hour-label"
                style={{ height: HOUR_HEIGHT }}
              >
                <span>{formatarHoraGrade(hour)}</span>
              </div>
            ))}
          </div>

          <div className="brisa-timegrid__columns" style={gridCols}>
            {dias.map((dia) => {
              const escala = escalasPorData.get(dia);
              const turnosDoDia = (escala?.turnos ?? [])
                .map((te) => {
                  const turno = turnos.find((t) => t.id === te.turnoId);
                  return turno ? { te, turno } : null;
                })
                .filter(Boolean) as { te: TurnoEscalado; turno: Turno }[];

              const layoutSobreposicao = calcularLayoutSobreposicao(
                turnosDoDia.map(({ te, turno }) => ({
                  id: te.id,
                  inicioMin: horarioToMin(turno.horaInicio),
                  fimMin: horarioToMin(turno.horaFim),
                })),
              );

              return (
                <div key={dia} className="brisa-timegrid__col">
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="brisa-timegrid__hour-line"
                      style={{ height: HOUR_HEIGHT }}
                    />
                  ))}

                  {turnosDoDia.map(({ te, turno }) => {
                    const status = calcularStatusTurnoEscaladoNoDia(
                      dia,
                      turno,
                      te,
                      funcionarios,
                      extras,
                    );
                    const top = topTurnoPx(turno.horaInicio);
                    const height = alturaTurnoPx(
                      turno.horaInicio,
                      turno.horaFim,
                    );
                    const layout = layoutSobreposicao.get(te.id) ?? { nivel: 0 };
                    const posicao = estiloBlocoSobreposicao(layout);

                    return (
                      <button
                        key={te.id}
                        type="button"
                        className={`brisa-timegrid__bloco ${classeStatus(status.key)}`}
                        style={{
                          top,
                          height,
                          left: posicao.left,
                          width: posicao.width,
                          zIndex: posicao.zIndex,
                        }}
                        onClick={() => onAbrirTurno?.(dia, te.id)}
                        title={turno.nome}
                      >
                        <span className="brisa-timegrid__bloco-nome">
                          {turno.nome}
                        </span>
                        <span className="brisa-timegrid__bloco-hora">
                          {turno.horaInicio} – {turno.horaFim}
                        </span>
                      </button>
                    );
                  })}

                  {onAdicionar ? (
                    <div className="brisa-timegrid__add-anchor">
                      <button
                        type="button"
                        className="brisa-escala-add-mini"
                        onClick={() => onAdicionar(dia)}
                        aria-label="Adicionar turno"
                        title="Adicionar turno"
                      >
                        <Icon name="plus" size={12} />
                        <span className="brisa-escala-add-mini__label">Turno</span>
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
