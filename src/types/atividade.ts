export type AcaoAtividade =
  | 'criou'
  | 'editou'
  | 'excluiu'
  | 'gerou'
  | 'entrou';

export type ModuloAtividade =
  | 'funcionario'
  | 'extra'
  | 'turno'
  | 'escala'
  | 'usuario'
  | 'sessao';

export interface Atividade {
  id: string;
  /** Quem realizou a ação. */
  autorNome: string;
  /** Papel do autor para contexto (ou 'convidado'). */
  autorPapel: string | null;
  acao: AcaoAtividade;
  modulo: ModuloAtividade;
  /** Sobre o quê foi a ação (ex.: "Ana Almeida", "Turno da manhã"). */
  alvo: string;
  /** Detalhe livre opcional (ex.: "status: ativo → férias"). */
  detalhe?: string;
  /** Data/hora ISO. */
  data: string;
}

export type AtividadeInput = {
  acao: AcaoAtividade;
  modulo: ModuloAtividade;
  alvo: string;
  detalhe?: string;
  data?: string;
  autorNome?: string;
  autorPapel?: string | null;
  /** ID do profile (auth.uid) — use no login para evitar corrida com a sessão em memória. */
  autorProfileId?: string | null;
};

export const ACOES_ATIVIDADE: { value: AcaoAtividade; label: string }[] = [
  { value: 'criou', label: 'Criação' },
  { value: 'editou', label: 'Edição' },
  { value: 'excluiu', label: 'Exclusão' },
  { value: 'gerou', label: 'Geração' },
  { value: 'entrou', label: 'Acesso' },
];

export const MODULOS_ATIVIDADE: { value: ModuloAtividade; label: string }[] = [
  { value: 'funcionario', label: 'Funcionários' },
  { value: 'extra', label: 'Extras' },
  { value: 'turno', label: 'Turnos' },
  { value: 'escala', label: 'Escala' },
  { value: 'usuario', label: 'Usuários' },
  { value: 'sessao', label: 'Sessão' },
];
