import type { AlocacaoFuncao } from '../types/escala';
import type { Funcionario } from '../types/funcionario';
import type { PessoaExtra } from '../types/pessoaExtra';
import type { Turno, TurnoInput } from '../types/turno';
import {
  isRecorrenciaEscala,
  RECORRENCIA_TODO_DIA,
  type DiaSemanaRecorrente,
} from '../types/turno';
import { adicionarDias, fromISO } from './datas';
import {
  indisponibilidadeExtraNoDia,
  indisponibilidadeNoDia,
  podeAparecerComoSugeridoNoTurno,
  sanearAlocacoesUmaPessoaPorTurno,
} from './disponibilidade';

/**
 * Mesma regra usada ao criar `TurnoEscalado` na escala (recorrente ou manual):
 * respeita sugestões por função, lista legada, indisponibilidade na `data` e
 * uma pessoa só pode ocupar uma vaga no turno.
 */
export function montarAlocacoesIniciaisDoTurno(
  turno: Turno,
  funcionarios: Funcionario[],
  extras: PessoaExtra[],
  data: string,
): AlocacaoFuncao[] {
  const alocacoes: AlocacaoFuncao[] = [];
  const jaAlocados = new Set<string>();
  for (const necessidade of turno.necessidades) {
    const ids: string[] = [];

    function tentarAlocar(id: string): boolean {
      if (!id || ids.length >= necessidade.quantidade) return false;
      const extra = extras.find((x) => x.id === id);
      if (extra) {
        if (jaAlocados.has(id)) return false;
        if (indisponibilidadeExtraNoDia(extra, data) !== null) return false;
        ids.push(id);
        jaAlocados.add(id);
        return true;
      }
      const f = funcionarios.find((x) => x.id === id);
      if (!f || !podeAparecerComoSugeridoNoTurno(f)) return false;
      if (jaAlocados.has(id)) return false;
      if (indisponibilidadeNoDia(f, data) !== null) return false;
      ids.push(id);
      jaAlocados.add(id);
      return true;
    }

    const preferidos = turno.sugestoesPorFuncao?.[necessidade.funcao] ?? [];
    for (const id of preferidos) {
      if (ids.length >= necessidade.quantidade) break;
      tentarAlocar(id);
    }

    const sugeridosCompativeis = turno.funcionariosSugeridos.filter((id) => {
      if (jaAlocados.has(id)) return false;
      const extra = extras.find((x) => x.id === id);
      if (extra) return indisponibilidadeExtraNoDia(extra, data) === null;
      const f = funcionarios.find((x) => x.id === id);
      if (!f || !podeAparecerComoSugeridoNoTurno(f)) return false;
      if (indisponibilidadeNoDia(f, data) !== null) return false;
      return true;
    });
    for (const id of sugeridosCompativeis) {
      if (ids.length >= necessidade.quantidade) break;
      tentarAlocar(id);
    }

    if (ids.length > 0) {
      alocacoes.push({ funcao: necessidade.funcao, funcionarioIds: ids });
    }
  }
  return alocacoes;
}

/**
 * Alocações explícitas a partir do que o formulário do turno envia (cada vaga
 * preenchida). Usado ao guardar na Escala: o cartão do dia usa `TurnoEscalado.alocacoes`,
 * não só o modelo em `turnosStorage`.
 * Não descarta quem está de folga — a escolha no dia prevalece. Aplica
 * {@link sanearAlocacoesUmaPessoaPorTurno} como no resto da app.
 */
export function montarAlocacoesAPartirDoInputTurno(
  input: TurnoInput,
): AlocacaoFuncao[] {
  const bruto: AlocacaoFuncao[] = [];
  for (const n of input.necessidades) {
    const sugs = input.sugestoesPorFuncao?.[n.funcao];
    const ids: string[] = [];
    for (let i = 0; i < n.quantidade; i++) {
      const raw = sugs?.[i];
      const id = typeof raw === 'string' ? raw.trim() : '';
      if (id) ids.push(id);
    }
    if (ids.length > 0) {
      bruto.push({ funcao: n.funcao, funcionarioIds: ids });
    }
  }
  return sanearAlocacoesUmaPessoaPorTurno(bruto);
}

export function totalSlotsEmAlocacoes(alocs: AlocacaoFuncao[]): number {
  return alocs.reduce((acc, a) => acc + a.funcionarioIds.length, 0);
}

/** Quantas células de sugestão têm ID (o que o utilizador vê no modelo do turno). */
export function contarCelulasSugestaoPreenchidas(turno: Turno): number {
  if (turno.sugestoesPorFuncao) {
    let count = 0;
    for (const { funcao, quantidade } of turno.necessidades) {
      const arr = turno.sugestoesPorFuncao[funcao] ?? [];
      for (let i = 0; i < quantidade; i++) {
        if (arr[i]) count += 1;
      }
    }
    return count;
  }
  return Math.min(turno.funcionariosSugeridos.length, totalNecessidadesTurno(turno));
}

function totalNecessidadesTurno(turno: Turno): number {
  return turno.necessidades.reduce((acc, n) => acc + n.quantidade, 0);
}

/** Próxima data (a partir de `aPartirDe`, inclusive) com o dia da semana desejado. */
export function proximaDataComDiaSemana(
  aPartirDe: string,
  diaSemana: number,
): string {
  for (let i = 0; i < 7; i++) {
    const d = adicionarDias(aPartirDe, i);
    if (fromISO(d).getDay() === diaSemana) return d;
  }
  return aPartirDe;
}

/**
 * Data usada para simular quantas vagas as sugestões realmente preenchem
 * (indisponibilidade, duplicados). Turnos regulares com dia fixo usam a próxima
 * ocorrência desse dia a partir da referência (alinhado ao que a escala faz).
 */
export function dataReferenciaParaSugestoesDoTurno(
  turno: Turno,
  aPartirDe: string,
): string {
  if (
    turno.tipo === 'regular' &&
    isRecorrenciaEscala(turno.diaSemanaRecorrente)
  ) {
    if (turno.diaSemanaRecorrente === RECORRENCIA_TODO_DIA) return aPartirDe;
    return proximaDataComDiaSemana(
      aPartirDe,
      turno.diaSemanaRecorrente as DiaSemanaRecorrente,
    );
  }
  return aPartirDe;
}
