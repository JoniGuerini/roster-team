import type {
  SeveridadeNotificacao,
  StatusNotificacao,
  TipoNotificacao,
} from '../types/notificacao';

export function toneSeveridade(
  severidade: SeveridadeNotificacao,
): 'danger' | 'warning' | 'info' {
  switch (severidade) {
    case 'alta':
      return 'danger';
    case 'media':
      return 'warning';
    default:
      return 'info';
  }
}

export function rotuloSeveridade(severidade: SeveridadeNotificacao): string {
  switch (severidade) {
    case 'alta':
      return 'Crítico';
    case 'media':
      return 'Atenção';
    default:
      return 'Aviso';
  }
}

export function rotuloStatus(status: StatusNotificacao): string {
  switch (status) {
    case 'nao_lida':
      return 'Não lida';
    case 'lida':
      return 'Lida';
    case 'adiada':
      return 'Adiada';
    case 'resolvida':
      return 'Resolvida';
  }
}

export const ROTULO_TIPO_CURTO: Record<TipoNotificacao, string> = {
  indisponivel: 'Indisponibilidade',
  conflito: 'Conflito',
  'cobertura-incompleta': 'Cobertura',
  'turno-vazio': 'Sem alocações',
  'cadastro-removido-na-escala': 'Cadastro apagado',
};

export function tempoRelativo(iso: string, agora = new Date()): string {
  const data = new Date(iso);
  const diffMs = agora.getTime() - data.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin}min atrás`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h atrás`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d atrás`;
  const diffSemanas = Math.floor(diffD / 7);
  if (diffSemanas < 5) return `${diffSemanas}sem atrás`;
  return data.toLocaleDateString('pt-BR');
}
