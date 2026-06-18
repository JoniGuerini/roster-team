import type {
  Notificacao,
  SeveridadeNotificacao,
  StatusNotificacao,
  TipoNotificacao,
} from '../types/notificacao';
import type { Database } from '../types/database';

export type NotificacaoRow = Database['public']['Tables']['notificacoes']['Row'];

const TIPOS: TipoNotificacao[] = [
  'indisponivel',
  'conflito',
  'cobertura-incompleta',
  'turno-vazio',
  'cadastro-removido-na-escala',
];

const SEVERIDADES: SeveridadeNotificacao[] = ['alta', 'media', 'baixa'];

const STATUS: StatusNotificacao[] = [
  'nao_lida',
  'lida',
  'adiada',
  'resolvida',
];

export function rowParaNotificacao(row: NotificacaoRow): Notificacao {
  return {
    id: row.id,
    chave: row.chave,
    tipo: TIPOS.includes(row.tipo as TipoNotificacao)
      ? (row.tipo as TipoNotificacao)
      : 'cobertura-incompleta',
    severidade: SEVERIDADES.includes(row.severidade as SeveridadeNotificacao)
      ? (row.severidade as SeveridadeNotificacao)
      : 'media',
    titulo: row.titulo,
    mensagem: row.mensagem,
    data: row.data,
    funcionarioId: row.funcionario_id ?? undefined,
    turnoEscaladoId: row.turno_escalado_id ?? undefined,
    turnoId: row.turno_id ?? undefined,
    status: STATUS.includes(row.status as StatusNotificacao)
      ? (row.status as StatusNotificacao)
      : 'nao_lida',
    detectadaEm: row.detectada_em,
    atualizadaEm: row.atualizada_em,
    resolvidaEm: row.resolvida_em ?? undefined,
    snoozeAte: row.snooze_ate ?? undefined,
  };
}

export function ordenarNotificacoes(lista: Notificacao[]): Notificacao[] {
  const ordemSeveridade: Record<SeveridadeNotificacao, number> = {
    alta: 0,
    media: 1,
    baixa: 2,
  };
  return [...lista].sort((a, b) => {
    const sevDiff =
      ordemSeveridade[a.severidade] - ordemSeveridade[b.severidade];
    if (sevDiff !== 0) return sevDiff;
    return b.detectadaEm.localeCompare(a.detectadaEm);
  });
}
