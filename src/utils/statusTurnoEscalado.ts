import type { TurnoEscalado } from '../types/escala';
import type { Funcionario } from '../types/funcionario';
import type { PessoaExtra } from '../types/pessoaExtra';
import type { Turno } from '../types/turno';
import { montarAlocacoesIniciaisDoTurno } from './alocacoesIniciaisTurno';
import {
  indisponibilidadeExtraNoDia,
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

/** Alocações do dia: usa a escala salva ou, se vazia, deriva do modelo (inclui extras). */
export function turnoEscaladoComAlocacoesEfetivas(
  data: string,
  turno: Turno,
  turnoEscalado: TurnoEscalado,
  funcionarios: Funcionario[],
  extras: PessoaExtra[],
): TurnoEscalado {
  if (totalSlotsAlocados(turnoEscalado) > 0) {
    return turnoEscalado;
  }
  return {
    ...turnoEscalado,
    alocacoes: montarAlocacoesIniciaisDoTurno(
      turno,
      funcionarios,
      extras,
      data,
    ),
  };
}

function contarIndisponiveisAlocados(
  data: string,
  idsAlocados: string[],
  funcionarios: Funcionario[],
  extras: PessoaExtra[],
): number {
  let indisponiveis = 0;
  for (const id of idsAlocados) {
    const funcionario = funcionarios.find((f) => f.id === id);
    if (funcionario) {
      if (indisponibilidadeNoDia(funcionario, data) !== null) {
        indisponiveis += 1;
      }
      continue;
    }
    const extra = extras.find((e) => e.id === id);
    if (extra && indisponibilidadeExtraNoDia(extra, data) !== null) {
      indisponiveis += 1;
    }
  }
  return indisponiveis;
}

/** Status da alocação real na escala (vagas, folgas, indisponíveis). Extras contam como preenchimento. */
export function calcularStatusTurnoEscaladoNoDia(
  data: string,
  turno: Turno,
  turnoEscalado: TurnoEscalado,
  funcionarios: Funcionario[],
  extras: PessoaExtra[] = [],
): StatusTurnoEscalado {
  const efetivo = turnoEscaladoComAlocacoesEfetivas(
    data,
    turno,
    turnoEscalado,
    funcionarios,
    extras,
  );
  const totalNecessario = totalVagasNecessariasTurno(turno);
  const faltamVagas = vagasEmFaltaNoTurno(turno, efetivo);
  const semAlocacao = totalSlotsAlocados(efetivo) === 0;
  const idsAlocados = pessoasAlocadas(efetivo);
  const indisponiveis = contarIndisponiveisAlocados(
    data,
    idsAlocados,
    funcionarios,
    extras,
  );

  return textoStatus(
    faltamVagas,
    semAlocacao,
    totalNecessario,
    indisponiveis,
  );
}
