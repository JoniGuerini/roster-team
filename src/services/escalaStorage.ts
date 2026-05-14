import type { AlocacaoFuncao, EscalaDia, TurnoEscalado } from '../types/escala';
import type { Turno } from '../types/turno';
import { diaSemanaDe, diasNoIntervalo } from '../utils/datas';

const STORAGE_KEY = 'brisa-cafe:escalas';

function gerarId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function ler(): EscalaDia[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as EscalaDia[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (error) {
    console.error('Erro ao ler escalas do localStorage', error);
    return [];
  }
}

function escrever(escalas: EscalaDia[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(escalas));
}

function obterDia(escalas: EscalaDia[], data: string): EscalaDia {
  const existente = escalas.find((e) => e.data === data);
  if (existente) return existente;
  const novo: EscalaDia = { data, turnos: [] };
  escalas.push(novo);
  return novo;
}

export const escalaStorage = {
  listar(): EscalaDia[] {
    return ler();
  },

  obterDia(data: string): EscalaDia {
    return ler().find((e) => e.data === data) ?? { data, turnos: [] };
  },

  obterIntervalo(inicio: string, fim: string): EscalaDia[] {
    return ler().filter((e) => e.data >= inicio && e.data <= fim);
  },

  /**
   * Garante que cada turno **regular** ativo com `diaSemanaRecorrente` definido
   * exista na escala em todas as datas do intervalo cujo dia da semana coincide.
   * Não duplica se o mesmo `turnoId` já estiver no dia.
   */
  sincronizarTurnosRecorrentes(
    inicio: string,
    fim: string,
    turnos: Turno[],
    obterAlocacoes: (turno: Turno, data: string) => AlocacaoFuncao[],
  ): number {
    const escalas = ler();
    let adicionados = 0;
    const agora = new Date().toISOString();
    for (const data of diasNoIntervalo(inicio, fim)) {
      const dia = obterDia(escalas, data);
      const idsPresentes = new Set(dia.turnos.map((t) => t.turnoId));
      for (const turno of turnos) {
        if (!turno.ativo || turno.tipo !== 'regular') continue;
        const dsr = turno.diaSemanaRecorrente;
        if (dsr == null || dsr < 0 || dsr > 6) continue;
        if (diaSemanaDe(data) !== dsr) continue;
        if (idsPresentes.has(turno.id)) continue;
        const alocacoes = obterAlocacoes(turno, data);
        const novo: TurnoEscalado = {
          id: gerarId(),
          turnoId: turno.id,
          alocacoes,
          criadoEm: agora,
          atualizadoEm: agora,
        };
        dia.turnos.push(novo);
        idsPresentes.add(turno.id);
        adicionados += 1;
      }
    }
    if (adicionados > 0) {
      escrever(escalas);
    }
    return adicionados;
  },

  adicionarTurno(data: string, turnoId: string, alocacoes: AlocacaoFuncao[]): TurnoEscalado {
    const escalas = ler();
    const dia = obterDia(escalas, data);
    const agora = new Date().toISOString();
    const novo: TurnoEscalado = {
      id: gerarId(),
      turnoId,
      alocacoes,
      criadoEm: agora,
      atualizadoEm: agora,
    };
    dia.turnos.push(novo);
    escrever(escalas);
    return novo;
  },

  atualizarTurno(
    data: string,
    turnoEscaladoId: string,
    patch: Partial<Pick<TurnoEscalado, 'alocacoes' | 'observacao'>>,
  ): TurnoEscalado | undefined {
    const escalas = ler();
    const dia = escalas.find((e) => e.data === data);
    if (!dia) return undefined;
    const turno = dia.turnos.find((t) => t.id === turnoEscaladoId);
    if (!turno) return undefined;
    if (patch.alocacoes) turno.alocacoes = patch.alocacoes;
    if (patch.observacao !== undefined) turno.observacao = patch.observacao;
    turno.atualizadoEm = new Date().toISOString();
    escrever(escalas);
    return turno;
  },

  removerTurno(data: string, turnoEscaladoId: string): boolean {
    const escalas = ler();
    const dia = escalas.find((e) => e.data === data);
    if (!dia) return false;
    const tamanho = dia.turnos.length;
    dia.turnos = dia.turnos.filter((t) => t.id !== turnoEscaladoId);
    if (dia.turnos.length === tamanho) return false;
    escrever(escalas.filter((e) => e.turnos.length > 0));
    return true;
  },
};
