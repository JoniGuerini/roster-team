export type TipoNotificacao =
  | 'indisponivel'
  | 'conflito'
  | 'cobertura-incompleta'
  | 'turno-vazio';

export type SeveridadeNotificacao = 'alta' | 'media' | 'baixa';

export type StatusNotificacao = 'nao_lida' | 'lida' | 'adiada' | 'resolvida';

export interface Notificacao {
  id: string;
  chave: string;
  tipo: TipoNotificacao;
  severidade: SeveridadeNotificacao;
  titulo: string;
  mensagem: string;
  data: string;
  funcionarioId?: string;
  turnoEscaladoId?: string;
  turnoId?: string;
  status: StatusNotificacao;
  detectadaEm: string;
  atualizadaEm: string;
  resolvidaEm?: string;
  snoozeAte?: string;
}

export const ROTULOS_TIPO: Record<TipoNotificacao, string> = {
  indisponivel: 'Indisponibilidade',
  conflito: 'Conflito de horário',
  'cobertura-incompleta': 'Cobertura incompleta',
  'turno-vazio': 'Turno sem alocações',
};
