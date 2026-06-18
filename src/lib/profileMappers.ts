import type {
  PapelUsuario,
  Permissao,
  StatusUsuario,
  Usuario,
} from '../types/usuario';
import type { Database } from '../types/database';

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];

type ProfileRowComPerfil = ProfileRow & {
  perfis_acesso?: { nome: string } | { nome: string }[] | null;
};

function mapPapel(valor: string | null): PapelUsuario {
  if (
    valor === 'administrador' ||
    valor === 'gerente' ||
    valor === 'supervisor' ||
    valor === 'colaborador'
  ) {
    return valor;
  }
  return 'colaborador';
}

function mapStatus(valor: string): StatusUsuario {
  if (valor === 'inativo' || valor === 'convite-pendente') return valor;
  return 'ativo';
}

function mapPermissoes(valor: unknown): Permissao[] {
  if (!Array.isArray(valor)) return [];
  return valor.filter((p): p is Permissao => typeof p === 'string');
}

function extrairNomePerfil(
  relacao: ProfileRowComPerfil['perfis_acesso'],
): string | null {
  if (!relacao) return null;
  if (Array.isArray(relacao)) return relacao[0]?.nome ?? null;
  return relacao.nome ?? null;
}

export function papelLegadoDePerfil(nomePerfil: string): PapelUsuario {
  const nome = nomePerfil.trim().toLowerCase();
  if (nome === 'administrador') return 'administrador';
  if (nome === 'gerente') return 'gerente';
  if (nome === 'editor') return 'supervisor';
  return 'colaborador';
}

export function rowParaUsuario(row: ProfileRowComPerfil): Usuario {
  const perfilAcessoNome = extrairNomePerfil(row.perfis_acesso);

  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    empresaId: row.empresa_id,
    perfilAcessoId: row.perfil_acesso_id,
    perfilAcessoNome,
    papel: mapPapel(row.papel),
    permissoes: mapPermissoes(row.permissoes),
    status: mapStatus(row.status),
    senhaDefinidaEm: null,
    ultimoAcesso: row.ultimo_acesso,
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  };
}
