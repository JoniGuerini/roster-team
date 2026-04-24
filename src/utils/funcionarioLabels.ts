import {
  FUNCOES,
  LOCAIS_TRABALHO,
  STATUS_FUNCIONARIO,
  TIPOS_CONTRATO,
  type Funcao,
  type LocalTrabalho,
  type StatusFuncionario,
  type TipoContrato,
} from '../types/funcionario';

function buscar<T extends string>(
  lista: { value: T; label: string }[],
  valor: T,
): string {
  return lista.find((item) => item.value === valor)?.label ?? valor;
}

export const labelLocal = (valor: LocalTrabalho) =>
  buscar(LOCAIS_TRABALHO, valor);
export const labelContrato = (valor: TipoContrato) =>
  buscar(TIPOS_CONTRATO, valor);
export const labelFuncao = (valor: Funcao) => buscar(FUNCOES, valor);
export const labelStatus = (valor: StatusFuncionario) =>
  buscar(STATUS_FUNCIONARIO, valor);

export function toneStatus(
  valor: StatusFuncionario,
): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (valor) {
    case 'ativo':
      return 'success';
    case 'ferias':
      return 'warning';
    case 'afastado':
      return 'danger';
    case 'inativo':
    default:
      return 'neutral';
  }
}

export function formatarData(iso: string): string {
  if (!iso) return '—';
  const [ano, mes, dia] = iso.split('-');
  if (!ano || !mes || !dia) return iso;
  return `${dia}/${mes}/${ano}`;
}

export function iniciaisDoNome(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0] ?? ''}${partes[partes.length - 1][0] ?? ''}`.toUpperCase();
}
