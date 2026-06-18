import type { Permissao } from './usuario';
import { TODAS_PERMISSOES } from './usuario';

export interface PerfilAcesso {
  id: string;
  empresaId: string;
  nome: string;
  descricao: string;
  permissoes: Permissao[];
  ehSistema: boolean;
  ordem: number;
  criadoEm: string;
  atualizadoEm: string;
}

export type PerfilAcessoInput = Pick<
  PerfilAcesso,
  'nome' | 'descricao' | 'permissoes'
>;

export const PERFIS_ACESSO_PADRAO: Omit<
  PerfilAcessoInput,
  never
>[] & { ehSistema: boolean; ordem: number }[] = [
  {
    nome: 'Visualizador',
    descricao: 'Consulta a escala e recebe notificações.',
    permissoes: ['escala.ver', 'notificacoes.ver'],
    ehSistema: true,
    ordem: 1,
  },
  {
    nome: 'Editor',
    descricao: 'Monta escala e edita turnos, funcionários e extras.',
    permissoes: [
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
    ehSistema: true,
    ordem: 2,
  },
  {
    nome: 'Gerente',
    descricao: 'Operação completa da cafeteria, sem gestão de usuários.',
    permissoes: [
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
    ehSistema: true,
    ordem: 3,
  },
  {
    nome: 'Administrador',
    descricao: 'Acesso total, incluindo usuários, perfis e configurações.',
    permissoes: [...TODAS_PERMISSOES],
    ehSistema: true,
    ordem: 4,
  },
];
