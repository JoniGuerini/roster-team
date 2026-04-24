import type { Funcao, LocalTrabalho } from './funcionario';

export type TipoTurno = 'regular' | 'feriado' | 'especial';

export type CategoriaTurno = 'manha' | 'tarde' | 'noite' | 'integral' | 'outro';

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
  necessidades: NecessidadeFuncao[];
  funcionariosSugeridos: string[];
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
