import type { TurnoEscalado } from '../types/escala';
import type { Funcionario } from '../types/funcionario';
import type { Turno } from '../types/turno';
import {
  indisponibilidadeNoDia,
  pessoasAlocadas,
  totalSlotsAlocados,
  totalVagasNecessariasTurno,
  vagasEmFaltaNoTurno,
} from './disponibilidade';

export type StatusTurnoEscaladoKey =
  | 'completo'
  | 'parcial'
  | 'vazio'
  | 'alerta';

export interface StatusTurnoEscalado {
  key: StatusTurnoEscaladoKey;
  texto: string;
}

function textoStatus(
  faltamVagas: number,
  semAlocacao: boolean,
  totalNecessario: number,
  indisponiveis: number,
): StatusTurnoEscalado {
  if (indisponiveis > 0) {
    return {
      key: 'alerta',
      texto:
        indisponiveis === 1
          ? '1 indisponível'
          : `${indisponiveis} indisponíveis`,
    };
  }
  if (totalNecessario > 0 && semAlocacao) {
    return { key: 'vazio', texto: 'Sem alocações' };
  }
  if (totalNecessario > 0 && faltamVagas === 0) {
    return { key: 'completo', texto: 'Equipe completa' };
  }
  if (faltamVagas > 0) {
    return {
      key: 'parcial',
      texto: faltamVagas === 1 ? 'Falta 1 vaga' : `Faltam ${faltamVagas}`,
    };
  }
  return { key: 'completo', texto: 'Equipe completa' };
}

/** Status da alocação real na escala (vagas, folgas, indisponíveis). */
export function calcularStatusTurnoEscaladoNoDia(
  data: string,
  turno: Turno,
  turnoEscalado: TurnoEscalado,
  funcionarios: Funcionario[],
): StatusTurnoEscalado {
  const totalNecessario = totalVagasNecessariasTurno(turno);
  const faltamVagas = vagasEmFaltaNoTurno(turno, turnoEscalado);
  const semAlocacao = totalSlotsAlocados(turnoEscalado) === 0;
  const idsAlocados = pessoasAlocadas(turnoEscalado);

  const indisponiveis = idsAlocados
    .map((id) => funcionarios.find((f) => f.id === id))
    .filter(Boolean)
    .map((f) => ({
      funcionario: f!,
      indisp: indisponibilidadeNoDia(f!, data),
    }))
    .filter((item) => item.indisp !== null).length;

  return textoStatus(
    faltamVagas,
    semAlocacao,
    totalNecessario,
    indisponiveis,
  );
}
