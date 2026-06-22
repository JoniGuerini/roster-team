/** Constantes e helpers da grade horária (alinhado ao Psico Lume). */

export const START_HOUR = 0;
export const END_HOUR = 24;
export const HOUR_HEIGHT = 56;
export const PX_PER_MIN = HOUR_HEIGHT / 60;
export const MIN_BLOCO_ALTURA = 22;
export const SCROLL_INICIAL_H = 5;

export const HOURS = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, i) => START_HOUR + i,
);

export function horarioToMin(hora: string): number {
  if (!hora) return 0;
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function duracaoTurnoMin(inicio: string, fim: string): number {
  const i = horarioToMin(inicio);
  const f = horarioToMin(fim);
  if (f > i) return f - i;
  return 24 * 60 - i + f;
}

export function topTurnoPx(inicio: string): number {
  return (horarioToMin(inicio) - START_HOUR * 60) * PX_PER_MIN;
}

export function alturaTurnoPx(inicio: string, fim: string): number {
  return Math.max(duracaoTurnoMin(inicio, fim) * PX_PER_MIN, MIN_BLOCO_ALTURA);
}

export function formatarHoraGrade(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}
