import {
  CATEGORIAS_TURNO,
  TIPOS_TURNO,
  type CategoriaTurno,
  type TipoTurno,
} from '../types/turno';

export function labelTipo(valor: TipoTurno): string {
  return TIPOS_TURNO.find((t) => t.value === valor)?.label ?? valor;
}

export function labelCategoria(valor: CategoriaTurno): string {
  return CATEGORIAS_TURNO.find((c) => c.value === valor)?.label ?? valor;
}

export function toneTipo(
  valor: TipoTurno,
): 'info' | 'warning' | 'success' | 'neutral' {
  switch (valor) {
    case 'regular':
      return 'info';
    case 'feriado':
      return 'warning';
    case 'especial':
      return 'success';
    default:
      return 'neutral';
  }
}

export function formatarHora(valor: string): string {
  if (!valor) return '—';
  return valor;
}

export function calcularDuracao(inicio: string, fim: string): string {
  if (!inicio || !fim) return '';
  const [hI, mI] = inicio.split(':').map(Number);
  const [hF, mF] = fim.split(':').map(Number);
  if (
    Number.isNaN(hI) ||
    Number.isNaN(mI) ||
    Number.isNaN(hF) ||
    Number.isNaN(mF)
  ) {
    return '';
  }
  let totalMin = hF * 60 + mF - (hI * 60 + mI);
  if (totalMin <= 0) totalMin += 24 * 60;
  const horas = Math.floor(totalMin / 60);
  const minutos = totalMin % 60;
  if (horas === 0) return `${minutos}min`;
  if (minutos === 0) return `${horas}h`;
  return `${horas}h${String(minutos).padStart(2, '0')}`;
}
