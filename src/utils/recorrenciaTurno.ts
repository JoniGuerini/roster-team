import type { RecorrenciaEscala } from '../types/turno';
import { RECORRENCIA_TODO_DIA } from '../types/turno';
import { diaSemanaDe } from './datas';

export function turnoRecorreNaData(
  recorrencia: RecorrenciaEscala,
  data: string,
): boolean {
  if (recorrencia === RECORRENCIA_TODO_DIA) return true;
  return diaSemanaDe(data) === recorrencia;
}
