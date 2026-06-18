export type StatusUsuario = 'ativo' | 'inativo' | 'convite-pendente';

export type PapelUsuario =
  | 'administrador'
  | 'gerente'
  | 'supervisor'
  | 'colaborador';

export type Permissao =
  | 'escala.ver'
  | 'escala.editar'
  | 'turnos.ver'
  | 'turnos.editar'
  | 'funcionarios.ver'
  | 'funcionarios.editar'
  | 'extras.ver'
  | 'extras.editar'
  | 'notificacoes.ver'
  | 'usuarios.gerir'
  | 'configuracoes.gerir';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  /** Empresa (tenant) a que este usuário pertence. */
  empresaId?: string | null;
  /** Perfil de acesso selecionado (template de permissões). */
  perfilAcessoId: string | null;
  perfilAcessoNome: string | null;
  /** Legado — mantido para compatibilidade com dados antigos. */
  papel: PapelUsuario;
  permissoes: Permissao[];
  status: StatusUsuario;
  /** Legado no tipo — não persistido; senhas são gerenciadas pelo Supabase Auth. */
  senhaDefinidaEm: string | null;
  /** Último login registrado em `profiles.ultimo_acesso`. */
  ultimoAcesso: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export type UsuarioInput = Omit<
  Usuario,
  | 'id'
  | 'criadoEm'
  | 'atualizadoEm'
  | 'ultimoAcesso'
  | 'senhaDefinidaEm'
  | 'perfilAcessoNome'
  | 'papel'
> & {
  perfilAcessoId: string;
};

export const PAPEIS_USUARIO: {
  value: PapelUsuario;
  label: string;
  descricao: string;
}[] = [
  {
    value: 'administrador',
    label: 'Administrador',
    descricao: 'Acesso total, incluindo gestão de usuários e permissões.',
  },
  {
    value: 'gerente',
    label: 'Gerente',
    descricao: 'Gere escala, turnos, funcionários e extras.',
  },
  {
    value: 'supervisor',
    label: 'Supervisor',
    descricao: 'Acompanha tudo e edita a escala do dia a dia.',
  },
  {
    value: 'colaborador',
    label: 'Colaborador',
    descricao: 'Consulta a escala e recebe notificações.',
  },
];

export const STATUS_USUARIO: { value: StatusUsuario; label: string }[] = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
  { value: 'convite-pendente', label: 'Convite pendente' },
];

export interface GrupoPermissao {
  modulo: string;
  label: string;
  permissoes: { value: Permissao; label: string }[];
}

export const GRUPOS_PERMISSOES: GrupoPermissao[] = [
  {
    modulo: 'escala',
    label: 'Escala',
    permissoes: [
      { value: 'escala.ver', label: 'Visualizar escala' },
      { value: 'escala.editar', label: 'Montar e editar escala' },
    ],
  },
  {
    modulo: 'turnos',
    label: 'Turnos',
    permissoes: [
      { value: 'turnos.ver', label: 'Visualizar turnos' },
      { value: 'turnos.editar', label: 'Criar e editar turnos' },
    ],
  },
  {
    modulo: 'funcionarios',
    label: 'Funcionários',
    permissoes: [
      { value: 'funcionarios.ver', label: 'Visualizar funcionários' },
      { value: 'funcionarios.editar', label: 'Cadastrar e editar funcionários' },
    ],
  },
  {
    modulo: 'extras',
    label: 'Extras',
    permissoes: [
      { value: 'extras.ver', label: 'Visualizar extras' },
      { value: 'extras.editar', label: 'Cadastrar e editar extras' },
    ],
  },
  {
    modulo: 'notificacoes',
    label: 'Notificações',
    permissoes: [{ value: 'notificacoes.ver', label: 'Receber notificações' }],
  },
  {
    modulo: 'usuarios',
    label: 'Usuários',
    permissoes: [
      { value: 'usuarios.gerir', label: 'Gerir usuários' },
    ],
  },
  {
    modulo: 'configuracoes',
    label: 'Configurações',
    permissoes: [
      { value: 'configuracoes.gerir', label: 'Gerir perfis de acesso' },
    ],
  },
];

export const TODAS_PERMISSOES: Permissao[] = GRUPOS_PERMISSOES.flatMap((g) =>
  g.permissoes.map((p) => p.value),
);

export const PERMISSOES_POR_PAPEL: Record<PapelUsuario, Permissao[]> = {
  administrador: [...TODAS_PERMISSOES],
  gerente: [
    'escala.ver',
    'escala.editar',
    'turnos.ver',
    'turnos.editar',
    'funcionarios.ver',
    'funcionarios.editar',
    'extras.ver',
    'extras.editar',
    'notificacoes.ver',
  ],
  supervisor: [
    'escala.ver',
    'escala.editar',
    'turnos.ver',
    'funcionarios.ver',
    'extras.ver',
    'notificacoes.ver',
  ],
  colaborador: ['escala.ver', 'notificacoes.ver'],
};
