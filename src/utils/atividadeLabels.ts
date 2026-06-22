import type { IconName } from '../components/ui/iconRegistry';
import {
  ACOES_ATIVIDADE,
  MODULOS_ATIVIDADE,
  type AcaoAtividade,
  type ModuloAtividade,
} from '../types/atividade';

export function labelAcao(acao: AcaoAtividade): string {
  return ACOES_ATIVIDADE.find((a) => a.value === acao)?.label ?? acao;
}

export function labelModulo(modulo: ModuloAtividade): string {
  return MODULOS_ATIVIDADE.find((m) => m.value === modulo)?.label ?? modulo;
}

/** Verbo no passado para montar a frase da atividade. */
export function verboAcao(acao: AcaoAtividade): string {
  switch (acao) {
    case 'criou':
      return 'criou';
    case 'editou':
      return 'editou';
    case 'excluiu':
      return 'excluiu';
    case 'gerou':
      return 'gerou senha de';
    case 'entrou':
      return 'entrou no sistema';
  }
}

/** Substantivo do módulo no singular para a frase. */
export function substantivoModulo(modulo: ModuloAtividade): string {
  switch (modulo) {
    case 'funcionario':
      return 'o funcionário';
    case 'extra':
      return 'o extra';
    case 'turno':
      return 'o turno';
    case 'escala':
      return 'a escala de';
    case 'usuario':
      return 'o usuário';
    case 'sessao':
      return '';
  }
}

export function iconeAcao(acao: AcaoAtividade): IconName {
  switch (acao) {
    case 'criou':
      return 'plus';
    case 'editou':
      return 'pencil';
    case 'excluiu':
      return 'trash';
    case 'gerou':
      return 'key';
    case 'entrou':
      return 'login';
  }
}

export function iconeModulo(modulo: ModuloAtividade): IconName {
  switch (modulo) {
    case 'funcionario':
      return 'users';
    case 'extra':
      return 'user-plus';
    case 'turno':
      return 'clock';
    case 'escala':
      return 'calendar-event';
    case 'usuario':
      return 'user-cog';
    case 'sessao':
      return 'login';
  }
}

export function toneAcao(
  acao: AcaoAtividade,
): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  switch (acao) {
    case 'criou':
      return 'success';
    case 'editou':
      return 'info';
    case 'excluiu':
      return 'danger';
    case 'gerou':
      return 'warning';
    case 'entrou':
      return 'neutral';
  }
}

/** Rótulo do dia para agrupar o histórico (Hoje / Ontem / data). */
export function rotuloDiaAtividade(iso: string, agora = new Date()): string {
  const data = new Date(iso);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(data, agora)) return 'Hoje';

  const ontem = new Date(agora);
  ontem.setDate(agora.getDate() - 1);
  if (sameDay(data, ontem)) return 'Ontem';

  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function horaAtividade(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
