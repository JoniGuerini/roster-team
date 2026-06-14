import {
  PAPEIS_USUARIO,
  STATUS_USUARIO,
  type PapelUsuario,
  type StatusUsuario,
} from '../types/usuario';

export function labelPapel(valor: PapelUsuario): string {
  return PAPEIS_USUARIO.find((p) => p.value === valor)?.label ?? valor;
}

export function descricaoPapel(valor: PapelUsuario): string {
  return PAPEIS_USUARIO.find((p) => p.value === valor)?.descricao ?? '';
}

export function labelStatusUsuario(valor: StatusUsuario): string {
  return STATUS_USUARIO.find((s) => s.value === valor)?.label ?? valor;
}

export function toneStatusUsuario(
  valor: StatusUsuario,
): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (valor) {
    case 'ativo':
      return 'success';
    case 'convite-pendente':
      return 'warning';
    case 'inativo':
    default:
      return 'neutral';
  }
}

export function tonePapel(
  valor: PapelUsuario,
): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
  switch (valor) {
    case 'administrador':
      return 'info';
    case 'gerente':
      return 'success';
    case 'supervisor':
      return 'warning';
    case 'colaborador':
    default:
      return 'neutral';
  }
}

export function formatarDataHora(iso: string | null): string {
  if (!iso) return 'Nunca';
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '—';
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
