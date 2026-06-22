import { horarioToMin } from './horarioGrade';

export const INTERVALO_HORARIO_MIN = 15;

export interface GrupoHorario {
  titulo: string;
  horarios: string[];
}

const GRUPOS: { titulo: string; inicioMin: number; fimMin: number }[] = [
  { titulo: 'Madrugada', inicioMin: 0, fimMin: 5 * 60 + 45 },
  { titulo: 'Manhã', inicioMin: 6 * 60, fimMin: 11 * 60 + 45 },
  { titulo: 'Tarde', inicioMin: 12 * 60, fimMin: 17 * 60 + 45 },
  { titulo: 'Noite', inicioMin: 18 * 60, fimMin: 23 * 60 + 45 },
];

export function formatarHorario(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function gerarHorarios(
  intervaloMin = INTERVALO_HORARIO_MIN,
): string[] {
  const horarios: string[] = [];
  for (let m = 0; m < 24 * 60; m += intervaloMin) {
    horarios.push(formatarHorario(m));
  }
  return horarios;
}

/** Garante que valores fora da grade (ex.: dados antigos) continuam selecionáveis. */
export function incluirHorariosExtras(
  horarios: string[],
  extras: string[],
): string[] {
  const unicos = new Set(horarios);
  for (const extra of extras) {
    if (extra) unicos.add(extra);
  }
  return [...unicos].sort((a, b) => horarioToMin(a) - horarioToMin(b));
}

export function agruparHorarios(horarios: string[]): GrupoHorario[] {
  const restantes = new Set(horarios);
  const grupos: GrupoHorario[] = [];

  for (const grupo of GRUPOS) {
    const doGrupo = horarios.filter((h) => {
      const min = horarioToMin(h);
      return min >= grupo.inicioMin && min <= grupo.fimMin;
    });
    for (const h of doGrupo) restantes.delete(h);
    if (doGrupo.length > 0) {
      grupos.push({ titulo: grupo.titulo, horarios: doGrupo });
    }
  }

  if (restantes.size > 0) {
    grupos.push({
      titulo: 'Outros',
      horarios: [...restantes].sort(
        (a, b) => horarioToMin(a) - horarioToMin(b),
      ),
    });
  }

  return grupos;
}

export function listarHorariosAgrupados(
  extras: string[] = [],
  excluir: string[] = [],
): GrupoHorario[] {
  const base = incluirHorariosExtras(gerarHorarios(), extras);
  const filtrados = base.filter((h) => !excluir.includes(h));
  return agruparHorarios(filtrados);
}
