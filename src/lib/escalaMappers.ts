import type {
  AlocacaoFuncao,
  EscalaDia,
  TurnoEscalado,
} from '../types/escala';
import type { Funcao } from '../types/funcionario';
import type { Database, Json } from '../types/database';

export type EscalaTurnoRow =
  Database['public']['Tables']['escala_turnos']['Row'];

const FUNCOES_VALIDAS: Funcao[] = [
  'atendente',
  'barista',
  'chapeiro',
  'gerente',
  'supervisor',
];

function mapAlocacoes(valor: unknown): AlocacaoFuncao[] {
  if (!Array.isArray(valor)) return [];
  return valor
    .filter(
      (a): a is AlocacaoFuncao =>
        typeof a === 'object' &&
        a !== null &&
        typeof (a as AlocacaoFuncao).funcao === 'string' &&
        Array.isArray((a as AlocacaoFuncao).funcionarioIds),
    )
    .map((a) => ({
      funcao: FUNCOES_VALIDAS.includes(a.funcao as Funcao)
        ? (a.funcao as Funcao)
        : 'atendente',
      funcionarioIds: a.funcionarioIds.filter(
        (id): id is string => typeof id === 'string',
      ),
    }));
}

export function rowParaTurnoEscalado(row: EscalaTurnoRow): TurnoEscalado {
  return {
    id: row.id,
    turnoId: row.turno_id,
    alocacoes: mapAlocacoes(row.alocacoes),
    observacao: row.observacao ?? undefined,
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  };
}

export function rowsParaEscalas(rows: EscalaTurnoRow[]): EscalaDia[] {
  const porData = new Map<string, TurnoEscalado[]>();
  const ordenadas = [...rows].sort((a, b) => {
    const cmpData = a.data.localeCompare(b.data);
    if (cmpData !== 0) return cmpData;
    return a.criado_em.localeCompare(b.criado_em);
  });

  for (const row of ordenadas) {
    const lista = porData.get(row.data) ?? [];
    lista.push(rowParaTurnoEscalado(row));
    porData.set(row.data, lista);
  }

  return [...porData.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([data, turnos]) => ({ data, turnos }));
}

export function alocacoesParaJson(alocacoes: AlocacaoFuncao[]): Json {
  return alocacoes as unknown as Json;
}
