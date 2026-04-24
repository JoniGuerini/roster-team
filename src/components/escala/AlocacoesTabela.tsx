import { useMemo } from 'react';
import type { EscalaDia } from '../../types/escala';
import type { Funcao, Funcionario } from '../../types/funcionario';
import type { Turno } from '../../types/turno';
import { Badge } from '../ui/Badge';
import {
  detectarConflitos,
  indisponibilidadeNoDia,
  type Indisponibilidade,
} from '../../utils/disponibilidade';
import { iniciaisDoNome, labelFuncao, labelLocal } from '../../utils/funcionarioLabels';
import './AlocacoesTabela.css';

interface AlocacoesTabelaProps {
  data: string;
  escala: EscalaDia;
  turnos: Turno[];
  funcionarios: Funcionario[];
}

interface LinhaTabela {
  chave: string;
  funcionarioId: string;
  funcionarioNome: string;
  funcao: Funcao;
  turnoEscaladoId: string;
  turnoNome: string;
  horaInicio: string;
  horaFim: string;
  localTrabalho: Turno['localTrabalho'];
  indisp: Indisponibilidade | null;
  conflitoCom: string[];
}

export function AlocacoesTabela({
  data,
  escala,
  turnos,
  funcionarios,
}: AlocacoesTabelaProps) {
  const linhas = useMemo<LinhaTabela[]>(() => {
    const out: LinhaTabela[] = [];
    for (const te of escala.turnos) {
      const turno = turnos.find((t) => t.id === te.turnoId);
      if (!turno) continue;
      for (const alocacao of te.alocacoes) {
        for (const funcionarioId of alocacao.funcionarioIds) {
          const f = funcionarios.find((x) => x.id === funcionarioId);
          if (!f) continue;
          const indisp = indisponibilidadeNoDia(f, data);
          const conflitos = detectarConflitos(
            funcionarioId,
            te.id,
            turno,
            escala,
            turnos,
          );
          out.push({
            chave: `${te.id}-${alocacao.funcao}-${funcionarioId}`,
            funcionarioId,
            funcionarioNome: f.nome,
            funcao: alocacao.funcao,
            turnoEscaladoId: te.id,
            turnoNome: turno.nome,
            horaInicio: turno.horaInicio,
            horaFim: turno.horaFim,
            localTrabalho: turno.localTrabalho,
            indisp,
            conflitoCom: conflitos.map((c) => c.turnoNome),
          });
        }
      }
    }
    return out.sort((a, b) => {
      const cmp = a.horaInicio.localeCompare(b.horaInicio);
      if (cmp !== 0) return cmp;
      return a.funcionarioNome.localeCompare(b.funcionarioNome, 'pt-BR');
    });
  }, [escala, turnos, funcionarios, data]);

  const totalAlertas = linhas.filter(
    (l) => l.indisp || l.conflitoCom.length > 0,
  ).length;

  if (linhas.length === 0) return null;

  return (
    <section className="brisa-aloc-tabela-card">
      <header className="brisa-aloc-tabela__header">
        <div>
          <h3 className="brisa-aloc-tabela__title">Pessoas escaladas no dia</h3>
          <p className="brisa-aloc-tabela__hint">
            {linhas.length}{' '}
            {linhas.length === 1 ? 'alocação' : 'alocações'}
            {totalAlertas > 0 && (
              <>
                {' · '}
                <span className="brisa-aloc-tabela__alert-count">
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

      <div className="brisa-aloc-tabela__wrapper">
        <table className="brisa-aloc-tabela">
          <thead>
            <tr>
              <th>Pessoa</th>
              <th>Função</th>
              <th>Turno</th>
              <th>Horário</th>
              <th>Local</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha) => {
              const temConflito = linha.conflitoCom.length > 0;
              const temIndisp = Boolean(linha.indisp);
              const rowClass = temConflito
                ? 'brisa-aloc-tabela__row--conflito'
                : temIndisp
                  ? 'brisa-aloc-tabela__row--indisp'
                  : '';
              return (
                <tr key={linha.chave} className={rowClass}>
                  <td>
                    <div className="brisa-aloc-tabela__pessoa">
                      <span className="brisa-aloc-tabela__avatar">
                        {iniciaisDoNome(linha.funcionarioNome)}
                      </span>
                      <span className="brisa-aloc-tabela__pessoa-nome">
                        {linha.funcionarioNome}
                      </span>
                    </div>
                  </td>
                  <td>{labelFuncao(linha.funcao)}</td>
                  <td>{linha.turnoNome}</td>
                  <td className="brisa-aloc-tabela__hora">
                    {linha.horaInicio} – {linha.horaFim}
                  </td>
                  <td>{labelLocal(linha.localTrabalho)}</td>
                  <td>
                    {temConflito ? (
                      <Badge tone="danger">
                        Conflito · {linha.conflitoCom.join(', ')}
                      </Badge>
                    ) : temIndisp ? (
                      <Badge tone="warning">{linha.indisp!.rotulo}</Badge>
                    ) : (
                      <Badge tone="success">Disponível</Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
