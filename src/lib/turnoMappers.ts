import type {
  CategoriaTurno,
  DiaSemanaRecorrente,
  NecessidadeFuncao,
  SugestoesPorFuncao,
  TipoTurno,
  Turno,
  TurnoInput,
} from '../types/turno';
import type { Funcao, LocalTrabalho } from '../types/funcionario';
import type { Database, Json } from '../types/database';

export type TurnoRow = Database['public']['Tables']['turnos']['Row'];

const FUNCOES_VALIDAS: Funcao[] = [
  'atendente',
  'barista',
  'chapeiro',
  'gerente',
  'supervisor',
];

function mapNecessidades(valor: unknown): NecessidadeFuncao[] {
  if (!Array.isArray(valor)) return [];
  return valor
    .filter(
      (n): n is NecessidadeFuncao =>
        typeof n === 'object' &&
        n !== null &&
        typeof (n as NecessidadeFuncao).funcao === 'string' &&
        typeof (n as NecessidadeFuncao).quantidade === 'number',
    )
    .map((n) => ({
      funcao: FUNCOES_VALIDAS.includes(n.funcao as Funcao)
        ? (n.funcao as Funcao)
        : 'atendente',
      quantidade: Math.max(0, n.quantidade),
    }));
}

function mapFuncionariosSugeridos(valor: unknown): string[] {
  if (!Array.isArray(valor)) return [];
  return valor.filter((id): id is string => typeof id === 'string');
}

function mapSugestoesPorFuncao(valor: unknown): SugestoesPorFuncao | undefined {
  if (valor == null || typeof valor !== 'object' || Array.isArray(valor)) {
    return undefined;
  }
  const resultado: SugestoesPorFuncao = {};
  for (const funcao of FUNCOES_VALIDAS) {
    const arr = (valor as Record<string, unknown>)[funcao];
    if (!Array.isArray(arr)) continue;
    resultado[funcao] = arr.filter((id): id is string => typeof id === 'string');
  }
  return Object.keys(resultado).length > 0 ? resultado : undefined;
}

function mapDiaSemanaRecorrente(
  valor: number | null,
): DiaSemanaRecorrente | null | undefined {
  if (valor == null) return null;
  if (valor >= 0 && valor <= 6) return valor as DiaSemanaRecorrente;
  return null;
}

export function rowParaTurno(row: TurnoRow): Turno {
  return {
    id: row.id,
    nome: row.nome,
    tipo: row.tipo as TipoTurno,
    categoria: row.categoria as CategoriaTurno,
    localTrabalho: row.local_trabalho as LocalTrabalho,
    horaInicio: row.hora_inicio,
    horaFim: row.hora_fim,
    diaSemanaRecorrente: mapDiaSemanaRecorrente(row.dia_semana_recorrente),
    necessidades: mapNecessidades(row.necessidades),
    funcionariosSugeridos: mapFuncionariosSugeridos(row.funcionarios_sugeridos),
    sugestoesPorFuncao: mapSugestoesPorFuncao(row.sugestoes_por_funcao),
    observacoes: row.observacoes ?? undefined,
    ativo: row.ativo,
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  };
}

export function inputParaTurnoRow(empresaId: string, input: TurnoInput) {
  return {
    empresa_id: empresaId,
    nome: input.nome.trim(),
    tipo: input.tipo,
    categoria: input.categoria,
    local_trabalho: input.localTrabalho,
    hora_inicio: input.horaInicio,
    hora_fim: input.horaFim,
    dia_semana_recorrente: input.diaSemanaRecorrente ?? null,
    necessidades: input.necessidades as unknown as Json,
    funcionarios_sugeridos: input.funcionariosSugeridos as unknown as Json,
    sugestoes_por_funcao: (input.sugestoesPorFuncao ?? null) as unknown as Json,
    observacoes: input.observacoes?.trim() || null,
    ativo: input.ativo,
  };
}
