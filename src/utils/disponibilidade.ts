import type { EscalaDia, TurnoEscalado } from '../types/escala';
import type { Funcionario, PeriodoAusencia } from '../types/funcionario';
import type { Turno } from '../types/turno';

export type MotivoIndisponibilidade =
  | 'inativo'
  | 'ferias'
  | 'afastamento'
  | 'licenca'
  | 'ausencia';

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
  return null;
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
