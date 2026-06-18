import type {
  AcaoAtividade,
  Atividade,
  ModuloAtividade,
} from '../types/atividade';
import type { Database } from '../types/database';

export type AtividadeRow = Database['public']['Tables']['atividades']['Row'];

const ACOES: AcaoAtividade[] = [
  'criou',
  'editou',
  'excluiu',
  'gerou',
  'entrou',
];

const MODULOS: ModuloAtividade[] = [
  'funcionario',
  'extra',
  'turno',
  'escala',
  'usuario',
  'sessao',
];

export function rowParaAtividade(row: AtividadeRow): Atividade {
  return {
    id: row.id,
    autorNome: row.autor_nome,
    autorPapel: row.autor_papel,
    acao: ACOES.includes(row.acao as AcaoAtividade)
      ? (row.acao as AcaoAtividade)
      : 'editou',
    modulo: MODULOS.includes(row.modulo as ModuloAtividade)
      ? (row.modulo as ModuloAtividade)
      : 'funcionario',
    alvo: row.alvo,
    detalhe: row.detalhe ?? undefined,
    data: row.criado_em,
  };
}
