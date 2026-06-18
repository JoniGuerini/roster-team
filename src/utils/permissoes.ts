import type { Permissao } from '../types/usuario';

export function temPermissao(
  permissoes: Permissao[] | readonly Permissao[] | undefined,
  permissao: Permissao,
): boolean {
  if (!permissoes?.length) return false;
  return permissoes.includes(permissao);
}

export function temAlgumaPermissao(
  permissoes: Permissao[] | readonly Permissao[] | undefined,
  exigidas: Permissao[],
): boolean {
  return exigidas.some((p) => temPermissao(permissoes, p));
}
