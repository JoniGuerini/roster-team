import type { Funcao } from './funcionario';

export interface AlocacaoFuncao {
  funcao: Funcao;
  funcionarioIds: string[];
}

export interface TurnoEscalado {
  id: string;
  turnoId: string;
  alocacoes: AlocacaoFuncao[];
  observacao?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface EscalaDia {
  data: string;
  turnos: TurnoEscalado[];
}
