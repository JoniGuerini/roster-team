import type {
  AlocacaoFuncao,
  EscalaDia,
  TurnoEscalado,
} from '../types/escala';
import type { Funcao } from '../types/funcionario';
import type { Database, Json } from '../types/database';
import { totalSlotsAlocados } from '../utils/disponibilidade';

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
        (id): id is string => typeof id === 'string' && id.trim().length > 0,
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

/** Prefere a linha com mais alocações; em empate, a mais recente. */
export function escolherMelhorRow(
  atual: EscalaTurnoRow,
  candidata: EscalaTurnoRow,
): EscalaTurnoRow {
  const slotsAtual = totalSlotsAlocados(rowParaTurnoEscalado(atual));
  const slotsCandidata = totalSlotsAlocados(rowParaTurnoEscalado(candidata));
  if (slotsCandidata !== slotsAtual) {
    return slotsCandidata > slotsAtual ? candidata : atual;
  }
  return candidata.atualizado_em.localeCompare(atual.atualizado_em) >= 0
    ? candidata
    : atual;
}

export function rowsParaEscalas(rows: EscalaTurnoRow[]): EscalaDia[] {
  const melhorPorDiaTurno = new Map<string, EscalaTurnoRow>();

  for (const row of rows) {
    const chave = `${row.data}|${row.turno_id}`;
    const existente = melhorPorDiaTurno.get(chave);
    melhorPorDiaTurno.set(
      chave,
      existente ? escolherMelhorRow(existente, row) : row,
    );
  }

  const porData = new Map<string, TurnoEscalado[]>();
  for (const row of melhorPorDiaTurno.values()) {
    const lista = porData.get(row.data) ?? [];
    lista.push(rowParaTurnoEscalado(row));
    porData.set(row.data, lista);
  }

  return [...porData.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([data, turnos]) => ({
      data,
      turnos: [...turnos].sort((a, b) =>
        a.criadoEm.localeCompare(b.criadoEm),
      ),
    }));
}

export function alocacoesParaJson(alocacoes: AlocacaoFuncao[]): Json {
  return alocacoes as unknown as Json;
}
