export type LocalTrabalho = 'posto-6' | 'leme';

export type TipoContrato = 'experimental' | 'efetivo';

export type Funcao =
  | 'atendente'
  | 'barista'
  | 'chapeiro'
  | 'gerente'
  | 'supervisor';

export type StatusFuncionario = 'ativo' | 'inativo' | 'ferias' | 'afastado';

/** Dia da semana fixo de folga (0 = domingo … 6 = sábado), igual a `Date.getDay()`. */
export type DiaFolgaSemanal = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const OPCOES_DIA_FOLGA_SEMANAL: { value: string; label: string }[] = [
  { value: '', label: 'Sem dia de folga fixo' },
  { value: '0', label: 'Domingo' },
  { value: '1', label: 'Segunda-feira' },
  { value: '2', label: 'Terça-feira' },
  { value: '3', label: 'Quarta-feira' },
  { value: '4', label: 'Quinta-feira' },
  { value: '5', label: 'Sexta-feira' },
  { value: '6', label: 'Sábado' },
];

export interface DocumentoPdf {
  id: string;
  nome: string;
  tamanho: number;
  dataUpload: string;
}

export type MotivoAusencia = 'ferias' | 'afastamento' | 'licenca' | 'outro';

export interface PeriodoAusencia {
  id: string;
  motivo: MotivoAusencia;
  inicio: string;
  fim: string;
  observacao?: string;
}

export interface Funcionario {
  id: string;
  nome: string;
  /** Usuário do sistema vinculado a este cadastro de equipe. */
  profileId?: string | null;
  cpf?: string | null;
  localTrabalho?: LocalTrabalho | null;
  tipoContrato?: TipoContrato | null;
  funcaoPrincipal?: Funcao | null;
  funcoesSecundarias?: Funcao[];
  dataAdmissao?: string | null;
  status?: StatusFuncionario | null;
  /** Dia da semana em que a pessoa não deve ser escalada (só para status ativo). */
  diaFolgaSemanal?: DiaFolgaSemanal | null;
  descricao?: string;
  documentos?: DocumentoPdf[];
  ausencias?: PeriodoAusencia[];
  criadoEm: string;
  atualizadoEm: string;
}

export type FuncionarioInput = Omit<
  Funcionario,
  'id' | 'criadoEm' | 'atualizadoEm'
>;

export const LOCAIS_TRABALHO: { value: LocalTrabalho; label: string }[] = [
  { value: 'posto-6', label: 'Posto 6' },
  { value: 'leme', label: 'Leme' },
];

export const TIPOS_CONTRATO: { value: TipoContrato; label: string }[] = [
  { value: 'experimental', label: 'Experimental' },
  { value: 'efetivo', label: 'Efetivo' },
];

export const FUNCOES: { value: Funcao; label: string }[] = [
  { value: 'atendente', label: 'Atendente' },
  { value: 'barista', label: 'Barista' },
  { value: 'chapeiro', label: 'Chapeiro' },
  { value: 'gerente', label: 'Gerente' },
  { value: 'supervisor', label: 'Supervisor' },
];

export const STATUS_FUNCIONARIO: {
  value: StatusFuncionario;
  label: string;
}[] = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
  { value: 'ferias', label: 'Em férias' },
  { value: 'afastado', label: 'Afastado' },
];

export const MOTIVOS_AUSENCIA: { value: MotivoAusencia; label: string }[] = [
  { value: 'ferias', label: 'Férias' },
  { value: 'afastamento', label: 'Afastamento' },
  { value: 'licenca', label: 'Licença' },
  { value: 'outro', label: 'Outro' },
];
