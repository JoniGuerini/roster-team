import type { PerfilAcesso } from '../types/perfilAcesso';
import type { Permissao } from '../types/usuario';
import type { Database } from '../types/database';

export type PerfilAcessoRow =
  Database['public']['Tables']['perfis_acesso']['Row'];

function mapPermissoes(valor: unknown): Permissao[] {
  if (!Array.isArray(valor)) return [];
  return valor.filter((p): p is Permissao => typeof p === 'string');
}

export function rowParaPerfilAcesso(row: PerfilAcessoRow): PerfilAcesso {
  return {
    id: row.id,
    empresaId: row.empresa_id,
    nome: row.nome,
    descricao: row.descricao,
    permissoes: mapPermissoes(row.permissoes),
    ehSistema: row.eh_sistema,
    ordem: row.ordem,
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  };
}

export function inputParaPerfilAcessoRow(
  empresaId: string,
  input: Pick<PerfilAcesso, 'nome' | 'descricao' | 'permissoes'>,
) {
  return {
    empresa_id: empresaId,
    nome: input.nome.trim(),
    descricao: input.descricao.trim(),
    permissoes: input.permissoes,
    eh_sistema: false,
  };
}
