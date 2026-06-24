import { useMemo } from 'react';
import type { EscalaDia } from '../../types/escala';
import type { Funcao, Funcionario } from '../../types/funcionario';
import { FUNCOES } from '../../types/funcionario';
import type { PessoaExtra } from '../../types/pessoaExtra';
import type { Turno } from '../../types/turno';
import { Badge } from '../ui/Badge';
import {
  indisponibilidadeNoDia,
  type Indisponibilidade,
} from '../../utils/disponibilidade';
import {
  iniciaisDoNome,
  labelFuncao,
  labelLocal,
} from '../../utils/funcionarioLabels';
import { nomePessoaAlocada } from '../../utils/pessoaAlocada';
import './AlocacoesTabela.css';

interface AlocacoesTabelaProps {
  data: string;
  escala: EscalaDia;
  turnos: Turno[];
  funcionarios: Funcionario[];
  extras: PessoaExtra[];
}

interface LinhaAloc {
  chave: string;
  funcionarioId: string;
  funcionarioNome: string;
  isExtra: boolean;
  funcao: Funcao;
  turnoEscaladoId: string;
  turnoNome: string;
  horaInicio: string;
  horaFim: string;
  localTrabalho: Turno['localTrabalho'];
  indisp: Indisponibilidade | null;
}

interface FuncaoGrupo {
  funcao: Funcao;
  linhas: LinhaAloc[];
}

interface TurnoGrupo {
  turnoEscaladoId: string;
  turnoNome: string;
  horaInicio: string;
  horaFim: string;
  localLabel: string;
  funcoes: FuncaoGrupo[];
}

const ORDEM_FUNCAO = new Map<Funcao, number>(
  FUNCOES.map((f, i) => [f.value, i]),
);

function montarLinha(
  te: EscalaDia['turnos'][number],
  turno: Turno,
  alocacao: { funcao: Funcao; funcionarioIds: string[] },
  funcionarioId: string,
  funcionarios: Funcionario[],
  extras: PessoaExtra[],
  data: string,
): LinhaAloc | null {
  const f = funcionarios.find((x) => x.id === funcionarioId);
  const ehExtra = Boolean(extras.find((x) => x.id === funcionarioId));
  if (!f && !ehExtra) return null;
  const indisp = f ? indisponibilidadeNoDia(f, data) : null;
  const nome = nomePessoaAlocada(funcionarioId, funcionarios, extras);
  return {
    chave: `${te.id}-${alocacao.funcao}-${funcionarioId}`,
    funcionarioId,
    funcionarioNome: nome,
    isExtra: ehExtra,
    funcao: alocacao.funcao,
    turnoEscaladoId: te.id,
    turnoNome: turno.nome,
    horaInicio: turno.horaInicio,
    horaFim: turno.horaFim,
    localTrabalho: turno.localTrabalho,
    indisp,
  };
}

export function AlocacoesTabela({
  data,
  escala,
  turnos,
  funcionarios,
  extras,
}: AlocacoesTabelaProps) {
  const { gruposPorTurno, totalLinhas, totalAlertas } = useMemo(() => {
    const turnosOrdenados = [...escala.turnos].sort((a, b) => {
      const ta = turnos.find((t) => t.id === a.turnoId)?.horaInicio ?? '';
      const tb = turnos.find((t) => t.id === b.turnoId)?.horaInicio ?? '';
      return ta.localeCompare(tb);
    });

    const grupos: TurnoGrupo[] = [];
    let linhasTotais = 0;
    let alertas = 0;

    for (const te of turnosOrdenados) {
      const turno = turnos.find((t) => t.id === te.turnoId);
      if (!turno) continue;

      const porFuncao = new Map<Funcao, LinhaAloc[]>();

      for (const alocacao of te.alocacoes) {
        for (const funcionarioId of alocacao.funcionarioIds) {
          const linha = montarLinha(
            te,
            turno,
            alocacao,
            funcionarioId,
            funcionarios,
            extras,
            data,
          );
          if (!linha) continue;
          const arr = porFuncao.get(alocacao.funcao) ?? [];
          arr.push(linha);
          porFuncao.set(alocacao.funcao, arr);
          linhasTotais += 1;
          if (linha.indisp) alertas += 1;
        }
      }

      const funcoesOrdenadas: FuncaoGrupo[] = [...porFuncao.entries()]
        .filter(([, linhas]) => linhas.length > 0)
        .sort(
          ([fa], [fb]) =>
            (ORDEM_FUNCAO.get(fa) ?? 99) - (ORDEM_FUNCAO.get(fb) ?? 99),
        )
        .map(([funcao, linhas]) => {
          linhas.sort((a, b) =>
            a.funcionarioNome.localeCompare(b.funcionarioNome, 'pt-BR'),
          );
          return { funcao, linhas };
        });

      if (funcoesOrdenadas.length === 0) continue;

      grupos.push({
        turnoEscaladoId: te.id,
        turnoNome: turno.nome,
        horaInicio: turno.horaInicio,
        horaFim: turno.horaFim,
        localLabel: labelLocal(turno.localTrabalho),
        funcoes: funcoesOrdenadas,
      });
    }

    return {
      gruposPorTurno: grupos,
      totalLinhas: linhasTotais,
      totalAlertas: alertas,
    };
  }, [escala, turnos, funcionarios, extras, data]);

  if (totalLinhas === 0) return null;

  return (
    <section className="brisa-aloc-dia">
      <header className="brisa-aloc-dia__header">
        <div>
          <h3 className="brisa-aloc-dia__title">Pessoas escaladas no dia</h3>
          <p className="brisa-aloc-dia__hint">
            {totalLinhas}{' '}
            {totalLinhas === 1 ? 'alocação' : 'alocações'}
            {totalAlertas > 0 && (
              <>
                {' · '}
                <span className="brisa-aloc-dia__alert-count">
                  {totalAlertas}{' '}
                  {totalAlertas === 1
                    ? 'precisa de atenção'
                    : 'precisam de atenção'}
                </span>
              </>
            )}
          </p>
        </div>
      </header>

      <div className="brisa-aloc-dia__lista">
        {gruposPorTurno.map((grupoTurno) => (
          <article
            key={grupoTurno.turnoEscaladoId}
            className="brisa-aloc-dia__turno"
          >
            <header className="brisa-aloc-dia__turno-head">
              <div className="brisa-aloc-dia__turno-titulo">
                <h4 className="brisa-aloc-dia__turno-nome">
                  {grupoTurno.turnoNome}
                </h4>
                <span className="brisa-aloc-dia__turno-meta">
                  <span className="brisa-aloc-dia__turno-hora">
                    {grupoTurno.horaInicio} – {grupoTurno.horaFim}
                  </span>
                  <span className="brisa-aloc-dia__turno-sep" aria-hidden="true">
                    ·
                  </span>
                  <span className="brisa-aloc-dia__turno-local">
                    {grupoTurno.localLabel}
                  </span>
                </span>
              </div>
            </header>

            <div className="brisa-aloc-dia__turno-corpo">
              {grupoTurno.funcoes.map((bloco) => (
                <div key={bloco.funcao} className="brisa-aloc-dia__funcao">
                  <h5 className="brisa-aloc-dia__funcao-label">
                    {labelFuncao(bloco.funcao)}
                    <span className="brisa-aloc-dia__funcao-count">
                      {bloco.linhas.length}
                    </span>
                  </h5>
                  <ul className="brisa-aloc-dia__pessoas">
                    {bloco.linhas.map((linha) => {
                      const folga = linha.indisp?.motivo === 'folga';
                      const temIndisp = Boolean(linha.indisp);
                      const rowClass = [
                        'brisa-aloc-dia__pessoa',
                        folga ? 'brisa-aloc-dia__pessoa--folga' : '',
                        !folga && temIndisp
                          ? 'brisa-aloc-dia__pessoa--indisp'
                          : '',
                      ]
                        .filter(Boolean)
                        .join(' ');
                      return (
                        <li key={linha.chave} className={rowClass}>
                          <span className="brisa-aloc-dia__avatar">
                            {iniciaisDoNome(linha.funcionarioNome)}
                          </span>
                          <span className="brisa-aloc-dia__pessoa-nome">
                            {linha.funcionarioNome}
                          </span>
                          <span className="brisa-aloc-dia__pessoa-status">
                            {temIndisp ? (
                              <Badge tone={folga ? 'info' : 'warning'}>
                                {linha.indisp!.rotulo}
                                {linha.indisp!.detalhe
                                  ? ` · ${linha.indisp!.detalhe}`
                                  : ''}
                              </Badge>
                            ) : linha.isExtra ? (
                              <Badge tone="info">Extra</Badge>
                            ) : (
                              <Badge tone="success">Disponível</Badge>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
