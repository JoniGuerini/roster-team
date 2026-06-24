export type StatusEmpresa = 'ativa' | 'inativa';

export type RecursoEmpresa =
  | 'escala'
  | 'turnos'
  | 'funcionarios'
  | 'extras'
  | 'notificacoes'
  | 'usuarios'
  | 'configuracoes'
  | 'atividades'
  | 'relatorios';

export interface Empresa {
  id: string;
  nome: string;
  /** Segmento/subtítulo curto (ex.: "Cafeteria"). */
  segmento: string;
  /** Logo como data URL (upload mock) ou caminho público; null usa as iniciais. */
  logoUrl: string | null;
  /** Cor principal da marca (hex), usada no fallback de logo e em destaques. */
  corPrimaria: string;
  ownerNome: string;
  ownerEmail: string;
  status: StatusEmpresa;
  /** Funcionalidades habilitadas para esta empresa (feature flags). */
  recursos: Record<RecursoEmpresa, boolean>;
  criadaEm: string;
  atualizadaEm: string;
}

export type EmpresaInput = Pick<
  Empresa,
  | 'nome'
  | 'segmento'
  | 'logoUrl'
  | 'corPrimaria'
  | 'ownerNome'
  | 'ownerEmail'
  | 'status'
>;

export const STATUS_EMPRESA: { value: StatusEmpresa; label: string }[] = [
  { value: 'ativa', label: 'Ativa' },
  { value: 'inativa', label: 'Inativa' },
];

export const COR_PRIMARIA_PADRAO = '#B8895A';

export const RECURSOS_EMPRESA: {
  value: RecursoEmpresa;
  label: string;
  descricao: string;
  icon: string;
}[] = [
  {
    value: 'escala',
    label: 'Escala',
    descricao: 'Montagem e visualização da escala da equipe.',
    icon: 'calendar-event',
  },
  {
    value: 'turnos',
    label: 'Turnos',
    descricao: 'Cadastro e gestão de turnos de trabalho.',
    icon: 'clock',
  },
  {
    value: 'funcionarios',
    label: 'Funcionários',
    descricao: 'Cadastro e perfis dos funcionários fixos.',
    icon: 'users',
  },
  {
    value: 'extras',
    label: 'Extras',
    descricao: 'Cadastro de pessoas extras / freelancers.',
    icon: 'user-plus',
  },
  {
    value: 'notificacoes',
    label: 'Notificações',
    descricao: 'Alertas de cobertura, indisponibilidades e avisos.',
    icon: 'bell',
  },
  {
    value: 'usuarios',
    label: 'Usuários',
    descricao: 'Acessos da equipe e gestão de permissões.',
    icon: 'user-cog',
  },
  {
    value: 'configuracoes',
    label: 'Configurações',
    descricao: 'Perfis de acesso personalizáveis da empresa.',
    icon: 'settings',
  },
  {
    value: 'atividades',
    label: 'Histórico de atividades',
    descricao: 'Registro de quem fez o quê no sistema.',
    icon: 'history',
  },
  {
    value: 'relatorios',
    label: 'Relatórios',
    descricao: 'Painéis e exportações (em breve).',
    icon: 'chart-bar',
  },
];

export const RECURSOS_PADRAO: Record<RecursoEmpresa, boolean> = {
  escala: true,
  turnos: true,
  funcionarios: true,
  extras: true,
  notificacoes: true,
  usuarios: true,
  configuracoes: true,
  atividades: true,
  relatorios: false,
};
