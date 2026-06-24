import type { StatusTurnoEscaladoKey } from './statusTurnoEscalado';

export interface ItemLegendaTurnoStatus {
  key: StatusTurnoEscaladoKey;
  label: string;
}

export const ITENS_LEGENDA_TURNO_STATUS: ItemLegendaTurnoStatus[] = [
  { key: 'completo', label: 'Equipe completa' },
  { key: 'parcial', label: 'Cobertura incompleta' },
  { key: 'vazio', label: 'Sem alocações' },
  { key: 'alerta', label: 'Indisponível' },
];
