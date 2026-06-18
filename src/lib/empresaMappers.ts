import {
  RECURSOS_PADRAO,
  type Empresa,
  type EmpresaInput,
  type RecursoEmpresa,
  type StatusEmpresa,
} from '../types/empresa';
import type { Database } from '../types/database';

export type EmpresaRow = Database['public']['Tables']['empresas']['Row'];

export function rowParaEmpresa(row: EmpresaRow): Empresa {
  const recursosBrutos = row.recursos as Partial<Record<RecursoEmpresa, boolean>>;
  return {
    id: row.id,
    nome: row.nome,
    segmento: row.segmento,
    logoUrl: row.logo_url,
    corPrimaria: row.cor_primaria,
    ownerNome: row.owner_nome,
    ownerEmail: row.owner_email,
    status: row.status as StatusEmpresa,
    recursos: { ...RECURSOS_PADRAO, ...recursosBrutos },
    criadaEm: row.criada_em,
    atualizadaEm: row.atualizada_em,
  };
}

export function inputParaRow(input: EmpresaInput) {
  return {
    nome: input.nome,
    segmento: input.segmento,
    logo_url: input.logoUrl,
    cor_primaria: input.corPrimaria,
    owner_nome: input.ownerNome,
    owner_email: input.ownerEmail,
    status: input.status,
  };
}
