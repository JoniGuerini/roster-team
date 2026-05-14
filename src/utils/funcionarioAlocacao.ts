import type { Funcao, Funcionario } from '../types/funcionario';

/** Pode ocupar uma vaga desta função no turno (principal ou secundária no cadastro). */
export function funcionarioPodeExercerFuncao(
  f: Funcionario,
  funcao: Funcao,
): boolean {
  if (f.funcaoPrincipal === funcao) return true;
  return (f.funcoesSecundarias ?? []).includes(funcao);
}
