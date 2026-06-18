import type { RotaId } from '../hooks/useHashRoute';
import type { RecursoEmpresa } from '../types/empresa';
import type { Permissao } from '../types/usuario';
import { temAlgumaPermissao, temPermissao } from './permissoes';

export type ModuloOperacional =
  | 'escala'
  | 'turnos'
  | 'funcionarios'
  | 'extras';

const PERMISSOES_VER_ROTA: Partial<Record<RotaId, Permissao[]>> = {
  escala: ['escala.ver', 'escala.editar'],
  turnos: ['turnos.ver', 'turnos.editar'],
  funcionarios: ['funcionarios.ver', 'funcionarios.editar'],
  extras: ['extras.ver', 'extras.editar'],
  notificacoes: ['notificacoes.ver'],
  usuarios: ['usuarios.gerir'],
  configuracoes: ['configuracoes.gerir'],
};

const ROTAS_EMPRESA: RotaId[] = [
  'escala',
  'turnos',
  'funcionarios',
  'extras',
  'notificacoes',
  'usuarios',
  'configuracoes',
  'atividades',
];

export function permissoesVerModulo(modulo: ModuloOperacional): Permissao[] {
  return [`${modulo}.ver`, `${modulo}.editar`];
}

export function podeVerModulo(
  permissoes: Permissao[] | readonly Permissao[] | undefined,
  modulo: ModuloOperacional,
): boolean {
  return temAlgumaPermissao(permissoes, permissoesVerModulo(modulo));
}

export function podeEditarModulo(
  permissoes: Permissao[] | readonly Permissao[] | undefined,
  modulo: ModuloOperacional,
): boolean {
  return temPermissao(permissoes, `${modulo}.editar`);
}

export function permissoesParaRota(rota: RotaId): Permissao[] | null {
  return PERMISSOES_VER_ROTA[rota] ?? null;
}

export function recursoDaRota(rota: RotaId): RecursoEmpresa | null {
  if (rota === 'perfil' || rota === 'empresas') return null;
  return rota as RecursoEmpresa;
}

export function podeAcessarRota(
  rota: RotaId,
  permissoes: Permissao[] | readonly Permissao[] | undefined,
  opcoes?: {
    recursoAtivo?: boolean;
    isPlatformAdmin?: boolean;
  },
): boolean {
  if (rota === 'perfil') return true;

  if (rota === 'empresas') {
    return opcoes?.isPlatformAdmin === true;
  }

  if (opcoes?.recursoAtivo === false) return false;

  const exigidas = permissoesParaRota(rota);
  if (!exigidas) {
    return true;
  }

  return temAlgumaPermissao(permissoes, exigidas);
}

export function primeiraRotaDisponivel(
  permissoes: Permissao[] | readonly Permissao[] | undefined,
  recursos?: Partial<Record<RecursoEmpresa, boolean>>,
): RotaId {
  for (const rota of ROTAS_EMPRESA) {
    const recurso = recursoDaRota(rota);
    const recursoAtivo = recurso ? recursos?.[recurso] !== false : true;
    if (podeAcessarRota(rota, permissoes, { recursoAtivo })) {
      return rota;
    }
  }
  return 'perfil';
}
