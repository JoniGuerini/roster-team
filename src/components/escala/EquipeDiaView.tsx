import { useMemo } from 'react';
import type { EscalaDia } from '../../types/escala';
import type { Funcao, Funcionario } from '../../types/funcionario';
import { FUNCOES } from '../../types/funcionario';
import type { PessoaExtra } from '../../types/pessoaExtra';
import type { Turno } from '../../types/turno';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Icon } from '../ui/Icon';
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
import './EquipeDiaView.css';

interface EquipeDiaViewProps {
  data: string;
  escala: EscalaDia;
  turnos: Turno[];
  funcionarios: Funcionario[];
  extras: PessoaExtra[];
  onAdicionar?: () => void;
  onAbrirTurno?: (turnoEscaladoId: string) => void;
}

interface TurnoDaPessoa {
  turnoEscaladoId: string;
  turnoNome: string;
  horaInicio: string;
  horaFim: string;
  localLabel: string;
}

interface PessoaNoGrupo {
  pessoaId: string;
  nome: string;
  isExtra: boolean;
  indisp: Indisponibilidade | null;
  turnos: TurnoDaPessoa[];
}

interface GrupoFuncao {
  funcao: Funcao;
  pessoas: PessoaNoGrupo[];
}

interface AlocacaoBruta {
  funcao: Funcao;
  pessoaId: string;
  nome: string;
  isExtra: boolean;
  indisp: Indisponibilidade | null;
  turno: TurnoDaPessoa;
}

const ORDEM_FUNCAO = new Map<Funcao, number>(
  FUNCOES.map((f, i) => [f.value, i]),
);

function montarAlocacao(
  te: EscalaDia['turnos'][number],
  turno: Turno,
  funcao: Funcao,
  pessoaId: string,
  funcionarios: Funcionario[],
  extras: PessoaExtra[],
  data: string,
): AlocacaoBruta | null {
  const f = funcionarios.find((x) => x.id === pessoaId);
  const ehExtra = Boolean(extras.find((x) => x.id === pessoaId));
  if (!f && !ehExtra) return null;

  return {
    funcao,
    pessoaId,
    nome: nomePessoaAlocada(pessoaId, funcionarios, extras),
    isExtra: ehExtra,
    indisp: f ? indisponibilidadeNoDia(f, data) : null,
    turno: {
      turnoEscaladoId: te.id,
      turnoNome: turno.nome,
      horaInicio: turno.horaInicio,
      horaFim: turno.horaFim,
      localLabel: labelLocal(turno.localTrabalho),
    },
  };
}

function agruparPessoasNoGrupo(itens: AlocacaoBruta[]): PessoaNoGrupo[] {
  const porPessoa = new Map<string, PessoaNoGrupo>();

  for (const item of itens) {
    const existente = porPessoa.get(item.pessoaId);
    if (existente) {
      const jaTem = existente.turnos.some(
        (t) => t.turnoEscaladoId === item.turno.turnoEscaladoId,
      );
      if (!jaTem) existente.turnos.push(item.turno);
      continue;
    }

    porPessoa.set(item.pessoaId, {
      pessoaId: item.pessoaId,
      nome: item.nome,
      isExtra: item.isExtra,
      indisp: item.indisp,
      turnos: [item.turno],
    });
  }

  return [...porPessoa.values()]
    .map((pessoa) => ({
      ...pessoa,
      turnos: [...pessoa.turnos].sort((a, b) =>
        a.horaInicio.localeCompare(b.horaInicio),
      ),
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

function pessoaTemAlerta(pessoa: PessoaNoGrupo): boolean {
  return Boolean(pessoa.indisp);
}

export function EquipeDiaView({
  data,
  escala,
  turnos,
  funcionarios,
  extras,
  onAdicionar,
  onAbrirTurno,
}: EquipeDiaViewProps) {
  const { grupos, totalPessoas, totalAlertas } = useMemo(() => {
    const brutos: AlocacaoBruta[] = [];
    const pessoasUnicas = new Set<string>();

    const turnosOrdenados = [...escala.turnos].sort((a, b) => {
      const ta = turnos.find((t) => t.id === a.turnoId)?.horaInicio ?? '';
      const tb = turnos.find((t) => t.id === b.turnoId)?.horaInicio ?? '';
      return ta.localeCompare(tb);
    });

    for (const te of turnosOrdenados) {
      const turno = turnos.find((t) => t.id === te.turnoId);
      if (!turno) continue;

      for (const alocacao of te.alocacoes) {
        for (const pessoaId of alocacao.funcionarioIds) {
          if (!pessoaId.trim()) continue;
          const item = montarAlocacao(
            te,
            turno,
            alocacao.funcao,
            pessoaId,
            funcionarios,
            extras,
            data,
          );
          if (!item) continue;
          brutos.push(item);
          pessoasUnicas.add(pessoaId);
        }
      }
    }

    const porFuncao = new Map<Funcao, AlocacaoBruta[]>();
    for (const item of brutos) {
      const lista = porFuncao.get(item.funcao) ?? [];
      lista.push(item);
      porFuncao.set(item.funcao, lista);
    }

    const gruposFuncao: GrupoFuncao[] = [...porFuncao.entries()]
      .sort(
        ([fa], [fb]) =>
          (ORDEM_FUNCAO.get(fa) ?? 99) - (ORDEM_FUNCAO.get(fb) ?? 99),
      )
      .map(([funcao, lista]) => ({
        funcao,
        pessoas: agruparPessoasNoGrupo(lista),
      }));

    let alertas = 0;
    const pessoasComAlerta = new Set<string>();
    for (const grupo of gruposFuncao) {
      for (const pessoa of grupo.pessoas) {
        if (pessoaTemAlerta(pessoa)) pessoasComAlerta.add(pessoa.pessoaId);
      }
    }
    alertas = pessoasComAlerta.size;

    return {
      grupos: gruposFuncao,
      totalPessoas: pessoasUnicas.size,
      totalAlertas: alertas,
    };
  }, [escala, turnos, funcionarios, extras, data]);

  if (escala.turnos.length === 0) {
    return (
      <div className="brisa-equipe-dia brisa-equipe-dia--empty">
        <EmptyState>
          <div className="brisa-empty__icon">
            <Icon name="calendar-event" size={20} />
          </div>
          <h3 className="brisa-empty__title">Nenhum turno neste dia</h3>
          <p className="brisa-empty__hint">
            Adicione turnos para ver quem estará trabalhando.
          </p>
          {onAdicionar ? (
            <Button
              size="sm"
              onClick={onAdicionar}
              leftIcon={<Icon name="plus" size={14} />}
            >
              Adicionar turno
            </Button>
          ) : null}
        </EmptyState>
      </div>
    );
  }

  if (totalPessoas === 0) {
    return (
      <div className="brisa-equipe-dia brisa-equipe-dia--empty">
        <EmptyState>
          <div className="brisa-empty__icon">
            <Icon name="users" size={20} />
          </div>
          <h3 className="brisa-empty__title">Ninguém alocado ainda</h3>
          <p className="brisa-empty__hint">
            Há turnos neste dia, mas nenhuma pessoa foi escalada. Abra um turno
            no painel ao lado para alocar a equipe.
          </p>
        </EmptyState>
      </div>
    );
  }

  return (
    <section className="brisa-equipe-dia">
      <header className="brisa-equipe-dia__header">
        <div>
          <h3 className="brisa-equipe-dia__title">Equipe do dia</h3>
          <p className="brisa-equipe-dia__hint">
            {totalPessoas}{' '}
            {totalPessoas === 1 ? 'pessoa escalada' : 'pessoas escaladas'}
            {totalAlertas > 0 ? (
              <>
                {' · '}
                <span className="brisa-equipe-dia__alert-count">
                  {totalAlertas}{' '}
                  {totalAlertas === 1
                    ? 'precisa de atenção'
                    : 'precisam de atenção'}
                </span>
              </>
            ) : null}
          </p>
        </div>
      </header>

      <div className="brisa-equipe-dia__grid">
        {grupos.map((grupo) => (
          <article key={grupo.funcao} className="brisa-equipe-dia__card">
            <header className="brisa-equipe-dia__card-head">
              <h4 className="brisa-equipe-dia__funcao">{labelFuncao(grupo.funcao)}</h4>
              <span className="brisa-equipe-dia__funcao-count">
                {grupo.pessoas.length}
              </span>
            </header>

            <ul className="brisa-equipe-dia__lista">
              {grupo.pessoas.map((pessoa) => {
                const folga = pessoa.indisp?.motivo === 'folga';
                const temIndisp = Boolean(pessoa.indisp);
                const rowClass = [
                  'brisa-equipe-dia__pessoa',
                  folga ? 'brisa-equipe-dia__pessoa--folga' : '',
                  !folga && temIndisp ? 'brisa-equipe-dia__pessoa--indisp' : '',
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <li key={`${grupo.funcao}-${pessoa.pessoaId}`}>
                    <div className={rowClass}>
                      <span className="brisa-equipe-dia__avatar">
                        {iniciaisDoNome(pessoa.nome)}
                      </span>
                      <span className="brisa-equipe-dia__pessoa-info">
                        <span className="brisa-equipe-dia__pessoa-nome">
                          {pessoa.nome}
                        </span>
                        <ul className="brisa-equipe-dia__turnos">
                          {pessoa.turnos.map((turno) => (
                            <li key={turno.turnoEscaladoId}>
                              <button
                                type="button"
                                className="brisa-equipe-dia__turno-btn"
                                onClick={() =>
                                  onAbrirTurno?.(turno.turnoEscaladoId)
                                }
                                title={`Abrir ${turno.turnoNome}`}
                              >
                                <span className="brisa-equipe-dia__turno-nome">
                                  {turno.turnoNome}
                                </span>
                                <span className="brisa-equipe-dia__turno-meta">
                                  {turno.horaInicio} – {turno.horaFim} ·{' '}
                                  {turno.localLabel}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </span>
                      <span className="brisa-equipe-dia__pessoa-status">
                        {temIndisp ? (
                          <Badge tone={folga ? 'info' : 'warning'}>
                            {pessoa.indisp!.rotulo}
                          </Badge>
                        ) : pessoa.isExtra ? (
                          <Badge tone="info">Extra</Badge>
                        ) : (
                          <Badge tone="success">Ok</Badge>
                        )}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
