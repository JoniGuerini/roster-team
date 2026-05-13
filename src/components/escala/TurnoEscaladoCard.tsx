import type { TurnoEscalado } from '../../types/escala';
import type { Funcionario } from '../../types/funcionario';
import type { Turno } from '../../types/turno';
import {
  indisponibilidadeNoDia,
  pessoasAlocadas,
  totalSlotsAlocados,
  totalVagasNecessariasTurno,
  vagasEmFaltaNoTurno,
} from '../../utils/disponibilidade';
import { labelLocal } from '../../utils/funcionarioLabels';
import { labelTipo } from '../../utils/turnoLabels';
import './TurnoEscaladoCard.css';

interface TurnoEscaladoCardProps {
  data: string;
  turnoEscalado: TurnoEscalado;
  turno: Turno;
  funcionarios: Funcionario[];
  variant?: 'compacto' | 'detalhado';
  onClick?: () => void;
}

type StatusKey = 'completo' | 'parcial' | 'vazio' | 'alerta';

interface Status {
  key: StatusKey;
  texto: string;
}

function calcularStatus(
  faltamVagas: number,
  semAlocacao: boolean,
  totalNecessario: number,
  indisponiveis: number,
): Status {
  if (indisponiveis > 0) {
    return {
      key: 'alerta',
      texto:
        indisponiveis === 1
          ? '1 indisponível'
          : `${indisponiveis} indisponíveis`,
    };
  }
  if (totalNecessario > 0 && semAlocacao) {
    return { key: 'vazio', texto: 'Sem alocações' };
  }
  if (totalNecessario > 0 && faltamVagas === 0) {
    return { key: 'completo', texto: 'Equipe completa' };
  }
  if (faltamVagas > 0) {
    return {
      key: 'parcial',
      texto: faltamVagas === 1 ? 'Falta 1 vaga' : `Faltam ${faltamVagas}`,
    };
  }
  return { key: 'completo', texto: 'Equipe completa' };
}

export function TurnoEscaladoCard({
  data,
  turnoEscalado,
  turno,
  funcionarios,
  variant = 'compacto',
  onClick,
}: TurnoEscaladoCardProps) {
  const totalNecessario = totalVagasNecessariasTurno(turno);
  const faltamVagas = vagasEmFaltaNoTurno(turno, turnoEscalado);
  const semAlocacao = totalSlotsAlocados(turnoEscalado) === 0;
  const idsAlocados = pessoasAlocadas(turnoEscalado);

  const indisponiveis = idsAlocados
    .map((id) => funcionarios.find((f) => f.id === id))
    .filter(Boolean)
    .map((f) => ({
      funcionario: f!,
      indisp: indisponibilidadeNoDia(f!, data),
    }))
    .filter((item) => item.indisp !== null);

  const status = calcularStatus(
    faltamVagas,
    semAlocacao,
    totalNecessario,
    indisponiveis.length,
  );

  const mostrarTipo = turno.tipo !== 'regular';

  return (
    <button
      type="button"
      className={`brisa-turno-esc brisa-turno-esc--${variant}`}
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

      {(mostrarTipo || variant === 'detalhado') && (
        <div className="brisa-turno-esc__meta">
          {mostrarTipo && (
            <span
              className={`brisa-turno-esc__tipo brisa-turno-esc__tipo--${turno.tipo}`}
            >
              {labelTipo(turno.tipo)}
            </span>
          )}
          {variant === 'detalhado' && (
            <span className="brisa-turno-esc__local">
              {labelLocal(turno.localTrabalho)}
            </span>
          )}
        </div>
      )}

      {variant === 'detalhado' && idsAlocados.length > 0 && (
        <ul className="brisa-turno-esc__pessoas">
          {idsAlocados.slice(0, 4).map((id) => {
            const f = funcionarios.find((x) => x.id === id);
            if (!f) return null;
            const indisp = indisponibilidadeNoDia(f, data);
            const pessoaMod = indisp
              ? indisp.motivo === 'folga'
                ? 'brisa-turno-esc__pessoa--folga'
                : 'brisa-turno-esc__pessoa--indisp'
              : '';
            return (
              <li
                key={id}
                className={`brisa-turno-esc__pessoa ${pessoaMod}`}
                title={indisp?.rotulo}
              >
                <span className="brisa-turno-esc__pessoa-nome">{f.nome}</span>
                {indisp && (
                  <span
                    className={`brisa-turno-esc__pessoa-tag ${indisp.motivo === 'folga' ? 'brisa-turno-esc__pessoa-tag--folga' : ''}`}
                  >
                    {indisp.rotulo}
                    {indisp.detalhe ? ` · ${indisp.detalhe}` : ''}
                  </span>
                )}
              </li>
            );
          })}
          {idsAlocados.length > 4 && (
            <li className="brisa-turno-esc__pessoa brisa-turno-esc__pessoa--mais">
              +{idsAlocados.length - 4}
            </li>
          )}
        </ul>
      )}
    </button>
  );
}
