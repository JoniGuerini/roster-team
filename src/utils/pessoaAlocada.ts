import type { Funcionario } from '../types/funcionario';
import type { PessoaExtra } from '../types/pessoaExtra';

export function nomePessoaAlocada(
  id: string,
  funcionarios: Funcionario[],
  extras: PessoaExtra[],
): string {
  const f = funcionarios.find((x) => x.id === id);
  if (f) return f.nome;
  const e = extras.find((x) => x.id === id);
  if (e) return e.nome;
  return 'Pessoa removida';
}

export function iniciaisPessoaAlocada(
  id: string,
  funcionarios: Funcionario[],
  extras: PessoaExtra[],
): string {
  const nome = nomePessoaAlocada(id, funcionarios, extras);
  if (nome === 'Pessoa removida') return '?';
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
