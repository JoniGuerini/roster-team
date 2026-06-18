import type {
  Funcionario,
  Funcao,
  LocalTrabalho,
  StatusFuncionario,
  TipoContrato,
} from '../types/funcionario';
import type { PessoaExtra } from '../types/pessoaExtra';
import {
  formatarData,
  labelContrato,
  labelFuncao,
  labelLocal,
  labelStatus,
} from './funcionarioLabels';
import { cpfDigitos } from './cpf';

/** Valor de select: filtrar registos com o campo em branco (extras). */
export const FILTRO_SEM_CAMPO = '__none__';

export function normalizarParaBusca(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Texto agregado para busca livre (qualquer coluna visível + chaves). */
export function haystackFuncionario(f: Funcionario): string {
  const d = f.dataAdmissao ?? '';
  const parts: string[] = [f.nome, f.cpf ?? '', cpfDigitos(f.cpf ?? '')];
  if (f.funcaoPrincipal) {
    parts.push(labelFuncao(f.funcaoPrincipal), f.funcaoPrincipal);
  } else {
    parts.push('sem função', 'sem funcao');
  }
  for (const fn of f.funcoesSecundarias ?? []) {
    parts.push(labelFuncao(fn), fn);
  }
  if (f.localTrabalho) {
    parts.push(labelLocal(f.localTrabalho), f.localTrabalho);
  } else {
    parts.push('sem local');
  }
  if (f.tipoContrato) {
    parts.push(labelContrato(f.tipoContrato), f.tipoContrato);
  } else {
    parts.push('sem contrato');
  }
  if (d) {
    parts.push(formatarData(d), d);
    if (d.includes('-')) {
      const [y, m, day] = d.split('-');
      if (y && m && day) parts.push(`${day}/${m}/${y}`);
    }
  } else {
    parts.push('sem admissão', 'sem admissao');
  }
  if (f.status) {
    parts.push(labelStatus(f.status), f.status);
  } else {
    parts.push('sem status');
  }
  return normalizarParaBusca(parts.join(' '));
}

export function haystackExtra(e: PessoaExtra): string {
  const parts: string[] = [e.nome, 'extra'];
  if (e.cpf) {
    parts.push(e.cpf, cpfDigitos(e.cpf));
  }
  if (e.funcaoPrincipal) {
    parts.push(labelFuncao(e.funcaoPrincipal), e.funcaoPrincipal);
  } else {
    parts.push('sem função', 'sem funcao');
  }
  for (const fn of e.funcoesSecundarias ?? []) {
    parts.push(labelFuncao(fn), fn);
  }
  if (e.localTrabalho) {
    parts.push(labelLocal(e.localTrabalho), e.localTrabalho);
  } else {
    parts.push('sem local');
  }
  if (e.tipoContrato) {
    parts.push(labelContrato(e.tipoContrato), e.tipoContrato);
  } else {
    parts.push('sem contrato');
  }
  if (e.dataAdmissao) {
    const d = e.dataAdmissao;
    parts.push(formatarData(d), d);
    if (d.includes('-')) {
      const [y, m, day] = d.split('-');
      if (y && m && day) parts.push(`${day}/${m}/${y}`);
    }
  } else {
    parts.push('sem admissão', 'sem admissao');
  }
  if (e.status) {
    parts.push(labelStatus(e.status), e.status);
  } else {
    parts.push('sem status');
  }
  return normalizarParaBusca(parts.join(' '));
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buscaEquipeMatch(haystack: string, termo: string): boolean {
  const t = normalizarParaBusca(termo);
  if (!t) return true;
  const partes = t.split(/\s+/).filter(Boolean);
  return partes.every((parte) =>
    new RegExp(`\\b${escapeRegex(parte)}`).test(haystack),
  );
}

export type FiltroColunasFuncionario = {
  funcao: '' | Funcao;
  local: '' | LocalTrabalho;
  contrato: '' | TipoContrato;
  status: '' | StatusFuncionario;
};

export function funcionarioPassaFiltrosColuna(
  f: Funcionario,
  filtros: FiltroColunasFuncionario,
): boolean {
  if (filtros.funcao && f.funcaoPrincipal !== filtros.funcao) return false;
  if (filtros.local && f.localTrabalho !== filtros.local) return false;
  if (filtros.contrato && f.tipoContrato !== filtros.contrato) return false;
  if (filtros.status && f.status !== filtros.status) return false;
  return true;
}

export type FiltroColunasExtra = {
  funcao: '' | Funcao | typeof FILTRO_SEM_CAMPO;
  local: '' | LocalTrabalho | typeof FILTRO_SEM_CAMPO;
  contrato: '' | TipoContrato | typeof FILTRO_SEM_CAMPO;
  status: '' | StatusFuncionario | typeof FILTRO_SEM_CAMPO;
};

export function extraPassaFiltrosColuna(
  e: PessoaExtra,
  filtros: FiltroColunasExtra,
): boolean {
  if (filtros.funcao === FILTRO_SEM_CAMPO) {
    if (e.funcaoPrincipal != null) return false;
  } else if (filtros.funcao && e.funcaoPrincipal !== filtros.funcao) {
    return false;
  }

  if (filtros.local === FILTRO_SEM_CAMPO) {
    if (e.localTrabalho != null) return false;
  } else if (filtros.local && e.localTrabalho !== filtros.local) {
    return false;
  }

  if (filtros.contrato === FILTRO_SEM_CAMPO) {
    if (e.tipoContrato != null) return false;
  } else if (filtros.contrato && e.tipoContrato !== filtros.contrato) {
    return false;
  }

  if (filtros.status === FILTRO_SEM_CAMPO) {
    if (e.status != null) return false;
  } else if (filtros.status && e.status !== filtros.status) {
    return false;
  }

  return true;
}
