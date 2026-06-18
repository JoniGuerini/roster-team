import type {
  DiaFolgaSemanal,
  DocumentoPdf,
  Funcao,
  Funcionario,
  FuncionarioInput,
  LocalTrabalho,
  MotivoAusencia,
  PeriodoAusencia,
  StatusFuncionario,
  TipoContrato,
} from '../types/funcionario';
import type { Database, Json } from '../types/database';

export type FuncionarioRow =
  Database['public']['Tables']['funcionarios']['Row'];

function mapFuncoesSecundarias(valor: unknown): Funcao[] {
  if (!Array.isArray(valor)) return [];
  const validas: Funcao[] = [
    'atendente',
    'barista',
    'chapeiro',
    'gerente',
    'supervisor',
  ];
  return valor.filter((f): f is Funcao => validas.includes(f as Funcao));
}

function mapDocumentos(valor: unknown): DocumentoPdf[] {
  if (!Array.isArray(valor)) return [];
  return valor
    .filter(
      (d): d is DocumentoPdf =>
        typeof d === 'object' &&
        d !== null &&
        typeof (d as DocumentoPdf).id === 'string' &&
        typeof (d as DocumentoPdf).nome === 'string',
    )
    .map((d) => ({
      id: d.id,
      nome: d.nome,
      tamanho: typeof d.tamanho === 'number' ? d.tamanho : 0,
      dataUpload:
        typeof d.dataUpload === 'string'
          ? d.dataUpload
          : new Date().toISOString(),
    }));
}

function mapAusencias(valor: unknown): PeriodoAusencia[] {
  if (!Array.isArray(valor)) return [];
  const motivos: MotivoAusencia[] = [
    'ferias',
    'afastamento',
    'licenca',
    'outro',
  ];
  return valor
    .filter(
      (a): a is PeriodoAusencia =>
        typeof a === 'object' &&
        a !== null &&
        typeof (a as PeriodoAusencia).id === 'string' &&
        typeof (a as PeriodoAusencia).inicio === 'string' &&
        typeof (a as PeriodoAusencia).fim === 'string',
    )
    .map((a) => ({
      id: a.id,
      motivo: motivos.includes(a.motivo) ? a.motivo : 'outro',
      inicio: a.inicio,
      fim: a.fim,
      observacao: a.observacao,
    }));
}

function mapDiaFolga(valor: number | null): DiaFolgaSemanal | null {
  if (valor == null) return null;
  if (valor >= 0 && valor <= 6) return valor as DiaFolgaSemanal;
  return null;
}

export function rowParaFuncionario(row: FuncionarioRow): Funcionario {
  return {
    id: row.id,
    nome: row.nome,
    profileId: row.profile_id,
    cpf: row.cpf,
    localTrabalho: row.local_trabalho as LocalTrabalho | null,
    tipoContrato: row.tipo_contrato as TipoContrato | null,
    funcaoPrincipal: row.funcao_principal as Funcao | null,
    funcoesSecundarias: mapFuncoesSecundarias(row.funcoes_secundarias),
    dataAdmissao: row.data_admissao,
    status: row.status as StatusFuncionario | null,
    diaFolgaSemanal: mapDiaFolga(row.dia_folga_semanal),
    descricao: row.descricao ?? undefined,
    documentos: mapDocumentos(row.documentos),
    ausencias: mapAusencias(row.ausencias),
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  };
}

export function inputParaFuncionarioRow(
  empresaId: string,
  input: FuncionarioInput,
) {
  return {
    empresa_id: empresaId,
    nome: input.nome.trim(),
    cpf: input.cpf?.trim() || null,
    local_trabalho: input.localTrabalho ?? null,
    tipo_contrato: input.tipoContrato ?? null,
    funcao_principal: input.funcaoPrincipal ?? null,
    funcoes_secundarias: (input.funcoesSecundarias ?? []) as unknown as Json,
    data_admissao: input.dataAdmissao || null,
    status: input.status ?? null,
    dia_folga_semanal: input.diaFolgaSemanal ?? null,
    descricao: input.descricao?.trim() || null,
    documentos: (input.documentos ?? []) as unknown as Json,
    ausencias: (input.ausencias ?? []) as unknown as Json,
  };
}
