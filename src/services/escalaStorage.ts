import type { AlocacaoFuncao, EscalaDia, TurnoEscalado } from '../types/escala';

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
