import type { Funcao, LocalTrabalho } from './funcionario';

/** Por função, uma entrada por vaga (mesma ordem da quantidade). IDs vazios = vaga sem sugestão. */
export type SugestoesPorFuncao = Partial<Record<Funcao, string[]>>;

export type TipoTurno = 'regular' | 'feriado' | 'especial';

export type CategoriaTurno = 'manha' | 'tarde' | 'noite' | 'integral' | 'outro';

/** 0 = domingo … 6 = sábado (igual a `Date.getDay()`). */
export type DiaSemanaRecorrente = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** -1 = entra automaticamente em todos os dias da escala. */
export const RECORRENCIA_TODO_DIA = -1 as const;

export type RecorrenciaEscala =
  | DiaSemanaRecorrente
  | typeof RECORRENCIA_TODO_DIA;

export const ROTULO_DIA_SEMANA_RECORRENTE: Record<DiaSemanaRecorrente, string> = {
  0: 'Todo domingo',
  1: 'Toda segunda-feira',
  2: 'Toda terça-feira',
  3: 'Toda quarta-feira',
  4: 'Toda quinta-feira',
  5: 'Toda sexta-feira',
  6: 'Todo sábado',
};

export function isRecorrenciaEscala(
  valor: number | null | undefined,
): valor is RecorrenciaEscala {
  if (valor == null) return false;
  return valor === RECORRENCIA_TODO_DIA || (valor >= 0 && valor <= 6);
}

export function rotuloRecorrenciaEscala(valor: RecorrenciaEscala): string {
  if (valor === RECORRENCIA_TODO_DIA) return 'Todo dia';
  return ROTULO_DIA_SEMANA_RECORRENTE[valor];
}

export function parseRecorrenciaEscala(
  valor: string,
): RecorrenciaEscala | undefined {
  if (valor === '') return undefined;
  const n = Number(valor);
  if (n === RECORRENCIA_TODO_DIA) return RECORRENCIA_TODO_DIA;
  if (n >= 0 && n <= 6) return n as DiaSemanaRecorrente;
  return undefined;
}

/** Opções do select: valor vazio = sem recorrência automática. */
export const OPCOES_DIA_SEMANA_RECORRENTE: { value: string; label: string }[] = [
  { value: '', label: 'Não — só entra na escala quando alguém adicionar' },
  {
    value: String(RECORRENCIA_TODO_DIA),
    label: rotuloRecorrenciaEscala(RECORRENCIA_TODO_DIA),
  },
  ...([0, 1, 2, 3, 4, 5, 6] as const).map((n) => ({
    value: String(n),
    label: ROTULO_DIA_SEMANA_RECORRENTE[n],
  })),
];

export interface NecessidadeFuncao {
  funcao: Funcao;
  quantidade: number;
}

export interface Turno {
  id: string;
  nome: string;
  tipo: TipoTurno;
  categoria: CategoriaTurno;
  localTrabalho: LocalTrabalho;
  horaInicio: string;
  horaFim: string;
  /**
   * Só para turnos `regular`: ao ver a escala, o sistema cria este turno em
   * cada data cujo dia da semana coincide, ou em todo dia se for `-1`.
   */
  diaSemanaRecorrente?: RecorrenciaEscala | null;
  necessidades: NecessidadeFuncao[];
  /** União ordenada dos sugeridos (retrocompatível com telas que só leem a lista). */
  funcionariosSugeridos: string[];
  sugestoesPorFuncao?: SugestoesPorFuncao;
  observacoes?: string;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export type TurnoInput = Omit<Turno, 'id' | 'criadoEm' | 'atualizadoEm'>;

export const TIPOS_TURNO: { value: TipoTurno; label: string }[] = [
  { value: 'regular', label: 'Regular' },
  { value: 'feriado', label: 'Feriado' },
  { value: 'especial', label: 'Especial / Evento' },
];

export const CATEGORIAS_TURNO: {
  value: CategoriaTurno;
  label: string;
  horaInicio: string;
  horaFim: string;
}[] = [
  { value: 'manha', label: 'Manhã', horaInicio: '06:00', horaFim: '12:00' },
  { value: 'tarde', label: 'Tarde', horaInicio: '12:00', horaFim: '18:00' },
  { value: 'noite', label: 'Noite', horaInicio: '18:00', horaFim: '23:00' },
  { value: 'integral', label: 'Integral', horaInicio: '08:00', horaFim: '18:00' },
  { value: 'outro', label: 'Outro', horaInicio: '09:00', horaFim: '17:00' },
];
