import type {
  DiaFolgaSemanal,
  DocumentoPdf,
  Funcao,
  LocalTrabalho,
  PeriodoAusencia,
  StatusFuncionario,
  TipoContrato,
} from './funcionario';

/**
 * Pessoa coberta pontualmente (não é funcionária de carteira).
 * Pode ser criada só com nome; os demais campos são opcionais e podem ser
 * preenchidos depois, como um cadastro completo.
 * Campos de documentos e ausências seguem o mesmo modelo do funcionário.
 */
export interface PessoaExtra {
  id: string;
  nome: string;
  localTrabalho?: LocalTrabalho | null;
  tipoContrato?: TipoContrato | null;
  funcaoPrincipal?: Funcao | null;
  funcoesSecundarias?: Funcao[];
  dataAdmissao?: string | null;
  status?: StatusFuncionario | null;
  diaFolgaSemanal?: DiaFolgaSemanal | null;
  descricao?: string;
  documentos?: DocumentoPdf[];
  ausencias?: PeriodoAusencia[];
  criadoEm: string;
  atualizadoEm: string;
}
export type PessoaExtraInput = Omit<
  PessoaExtra,
  'id' | 'criadoEm' | 'atualizadoEm'
>;
