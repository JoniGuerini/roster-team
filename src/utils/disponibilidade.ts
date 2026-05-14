import type { AlocacaoFuncao, EscalaDia, TurnoEscalado } from '../types/escala';
import type { Funcao, Funcionario, PeriodoAusencia } from '../types/funcionario';
import type { PessoaExtra } from '../types/pessoaExtra';
import type { Turno } from '../types/turno';
import { fromISO, NOMES_DIAS } from './datas';

export type MotivoIndisponibilidade =
  | 'inativo'
  | 'ferias'
  | 'afastamento'
  | 'licenca'
  | 'ausencia'
  | 'folga';

export interface Indisponibilidade {
  motivo: MotivoIndisponibilidade;
  rotulo: string;
  detalhe?: string;
}

export interface Conflito {
  turnoEscaladoId: string;
  turnoNome: string;
  horaInicio: string;
  horaFim: string;
}

function ausenciaCobreData(
  ausencia: PeriodoAusencia,
  data: string,
): boolean {
  return data >= ausencia.inicio && data <= ausencia.fim;
}

function rotuloMotivoAusencia(motivo: PeriodoAusencia['motivo']): {
  motivo: MotivoIndisponibilidade;
  rotulo: string;
} {
  switch (motivo) {
    case 'ferias':
      return { motivo: 'ferias', rotulo: 'De férias' };
    case 'afastamento':
      return { motivo: 'afastamento', rotulo: 'Afastado' };
    case 'licenca':
      return { motivo: 'licenca', rotulo: 'Em licença' };
    default:
      return { motivo: 'ausencia', rotulo: 'Ausente' };
  }
}

export function indisponibilidadeNoDia(
  funcionario: Funcionario,
  data: string,
): Indisponibilidade | null {
  if (funcionario.status === 'inativo') {
    return { motivo: 'inativo', rotulo: 'Inativo' };
  }
  const ausencia = (funcionario.ausencias ?? []).find((a) =>
    ausenciaCobreData(a, data),
  );
  if (ausencia) {
    const { motivo, rotulo } = rotuloMotivoAusencia(ausencia.motivo);
    return {
      motivo,
      rotulo,
      detalhe: `${ausencia.inicio} → ${ausencia.fim}`,
    };
  }
  if (funcionario.status === 'ativo') {
    if (
      funcionario.diaFolgaSemanal != null &&
      fromISO(data).getDay() === funcionario.diaFolgaSemanal
    ) {
      const nomeDia = NOMES_DIAS[funcionario.diaFolgaSemanal];
      return {
        motivo: 'folga',
        rotulo: 'Folga semanal',
        detalhe: nomeDia,
      };
    }
  }
  if (funcionario.status === 'ferias') {
    return { motivo: 'ferias', rotulo: 'Em férias' };
  }
  if (funcionario.status === 'afastado') {
    return { motivo: 'afastamento', rotulo: 'Afastado(a)' };
  }
  return null;
}

/** Mesmas regras de calendário que `indisponibilidadeNoDia` para funcionários, aplicadas ao extra. */
export function indisponibilidadeExtraNoDia(
  extra: PessoaExtra,
  data: string,
): Indisponibilidade | null {
  const status = extra.status ?? 'ativo';
  if (status === 'inativo') {
    return { motivo: 'inativo', rotulo: 'Inativo' };
  }
  const ausencia = (extra.ausencias ?? []).find((a) =>
    ausenciaCobreData(a, data),
  );
  if (ausencia) {
    const { motivo, rotulo } = rotuloMotivoAusencia(ausencia.motivo);
    return {
      motivo,
      rotulo,
      detalhe: `${ausencia.inicio} → ${ausencia.fim}`,
    };
  }
  if (status === 'ativo') {
    if (
      extra.diaFolgaSemanal != null &&
      fromISO(data).getDay() === extra.diaFolgaSemanal
    ) {
      const nomeDia = NOMES_DIAS[extra.diaFolgaSemanal];
      return {
        motivo: 'folga',
        rotulo: 'Folga semanal',
        detalhe: nomeDia,
      };
    }
  }
  if (status === 'ferias') {
    return { motivo: 'ferias', rotulo: 'Em férias' };
  }
  if (status === 'afastado') {
    return { motivo: 'afastamento', rotulo: 'Afastado(a)' };
  }
  return null;
}

/** Para sugestões de turno / pré-alocação: só quem está ativo no cadastro. */
export function podeAparecerComoSugeridoNoTurno(
  funcionario: Funcionario,
): boolean {
  return funcionario.status === 'ativo';
}

function horarioToMin(hora: string): number {
  if (!hora) return 0;
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + (m || 0);
}

function intervaloMinutos(
  inicio: string,
  fim: string,
): [number, number][] {
  const i = horarioToMin(inicio);
  const f = horarioToMin(fim);
  if (f > i) return [[i, f]];
  return [
    [i, 24 * 60],
    [0, f],
  ];
}

export function turnosColidem(a: Turno, b: Turno): boolean {
  const intervalosA = intervaloMinutos(a.horaInicio, a.horaFim);
  const intervalosB = intervaloMinutos(b.horaInicio, b.horaFim);
  return intervalosA.some(([aI, aF]) =>
    intervalosB.some(([bI, bF]) => aI < bF && bI < aF),
  );
}

export function detectarConflitos(
  funcionarioId: string,
  turnoAtualId: string | null,
  turnoCandidato: Turno,
  dia: EscalaDia,
  turnos: Turno[],
): Conflito[] {
  const conflitos: Conflito[] = [];
  for (const turnoEscalado of dia.turnos) {
    if (turnoEscalado.id === turnoAtualId) continue;
    const usaPessoa = turnoEscalado.alocacoes.some((a) =>
      a.funcionarioIds.includes(funcionarioId),
    );
    if (!usaPessoa) continue;
    const turno = turnos.find((t) => t.id === turnoEscalado.turnoId);
    if (!turno) continue;
    if (turnosColidem(turno, turnoCandidato)) {
      conflitos.push({
        turnoEscaladoId: turnoEscalado.id,
        turnoNome: turno.nome,
        horaInicio: turno.horaInicio,
        horaFim: turno.horaFim,
      });
    }
  }
  return conflitos;
}

export function pessoasAlocadas(turno: TurnoEscalado): string[] {
  const ids: string[] = [];
  for (const alocacao of turno.alocacoes) {
    for (const id of alocacao.funcionarioIds) {
      if (!ids.includes(id)) ids.push(id);
    }
  }
  return ids;
}

/** Total de posições ocupadas (a mesma pessoa em 2 funções conta 2). */
export function totalSlotsAlocados(turnoEscalado: TurnoEscalado): number {
  return turnoEscalado.alocacoes.reduce(
    (acc, a) => acc + a.funcionarioIds.length,
    0,
  );
}

export function quantidadeAlocadaNaFuncao(
  turnoEscalado: TurnoEscalado,
  funcao: Funcao,
): number {
  return (
    turnoEscalado.alocacoes.find((a) => a.funcao === funcao)?.funcionarioIds
      .length ?? 0
  );
}

/** Soma das vagas em falta face às necessidades declaradas no turno. */
export function vagasEmFaltaNoTurno(
  turno: Turno,
  turnoEscalado: TurnoEscalado,
): number {
  let faltam = 0;
  for (const n of turno.necessidades) {
    const alocado = quantidadeAlocadaNaFuncao(turnoEscalado, n.funcao);
    faltam += Math.max(0, n.quantidade - alocado);
  }
  return faltam;
}

export function totalVagasNecessariasTurno(turno: Turno): number {
  return turno.necessidades.reduce((acc, n) => acc + n.quantidade, 0);
}

/**
 * Garante no máximo uma função por pessoa no mesmo turno (mantém a 1ª ocorrência na ordem do array).
 */
export function sanearAlocacoesUmaPessoaPorTurno(
  alocacoes: AlocacaoFuncao[],
): AlocacaoFuncao[] {
  const visto = new Set<string>();
  return alocacoes
    .map((a) => ({
      funcao: a.funcao,
      funcionarioIds: a.funcionarioIds.filter((id) => {
        if (visto.has(id)) return false;
        visto.add(id);
        return true;
      }),
    }))
    .filter((a) => a.funcionarioIds.length > 0);
}
