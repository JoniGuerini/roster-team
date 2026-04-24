export type LocalTrabalho = 'posto-6' | 'leme';

export type TipoContrato = 'experimental' | 'efetivo';

export type Funcao =
  | 'atendente'
  | 'barista'
  | 'chapeiro'
  | 'gerente'
  | 'supervisor';

export type StatusFuncionario = 'ativo' | 'inativo' | 'ferias' | 'afastado';

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
  localTrabalho: LocalTrabalho;
  tipoContrato: TipoContrato;
  funcaoPrincipal: Funcao;
  funcoesSecundarias: Funcao[];
  dataAdmissao: string;
  status: StatusFuncionario;
  descricao?: string;
  documentos: DocumentoPdf[];
  ausencias: PeriodoAusencia[];
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
