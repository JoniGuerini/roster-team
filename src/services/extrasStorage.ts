import type { DiaFolgaSemanal } from '../types/funcionario';
import type { PessoaExtra, PessoaExtraInput } from '../types/pessoaExtra';

const STORAGE_KEY = 'brisa-cafe:pessoas-extras';

function gerarId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function ler(): PessoaExtra[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PessoaExtra[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((e) => ({
      ...e,
      funcoesSecundarias: Array.isArray(e.funcoesSecundarias)
        ? e.funcoesSecundarias
        : [],
      documentos: Array.isArray(e.documentos) ? e.documentos : [],
      ausencias: Array.isArray(e.ausencias) ? e.ausencias : [],
      diaFolgaSemanal:
        typeof e.diaFolgaSemanal === 'number' &&
        e.diaFolgaSemanal >= 0 &&
        e.diaFolgaSemanal <= 6
          ? (e.diaFolgaSemanal as DiaFolgaSemanal)
          : null,
    }));
  } catch (error) {
    console.error('Erro ao ler extras do localStorage', error);
    return [];
  }
}

function escrever(lista: PessoaExtra[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

export const extrasStorage = {
  listar(): PessoaExtra[] {
    return ler().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  },

  obter(id: string): PessoaExtra | undefined {
    return ler().find((e) => e.id === id);
  },

  /** Cadastro mínimo (ex.: a partir do turno). */
  criarSóNome(nome: string): PessoaExtra {
    const agora = new Date().toISOString();
    const trimmed = nome.trim();
    const novo: PessoaExtra = {
      id: gerarId(),
      nome: trimmed,
      funcoesSecundarias: [],
      criadoEm: agora,
      atualizadoEm: agora,
    };
    const lista = ler();
    lista.push(novo);
    escrever(lista);
    return novo;
  },

  criar(input: PessoaExtraInput): PessoaExtra {
    const agora = new Date().toISOString();
    const novo: PessoaExtra = {
      id: gerarId(),
      nome: input.nome.trim(),
      cpf: input.cpf,
      localTrabalho: input.localTrabalho,
      tipoContrato: input.tipoContrato,
      funcaoPrincipal: input.funcaoPrincipal,
      funcoesSecundarias: input.funcoesSecundarias ?? [],
      dataAdmissao: input.dataAdmissao,
      status: input.status,
      diaFolgaSemanal: input.diaFolgaSemanal,
      descricao: input.descricao,
      documentos: input.documentos ?? [],
      ausencias: input.ausencias ?? [],
      criadoEm: agora,
      atualizadoEm: agora,
    };
    const lista = ler();
    lista.push(novo);
    escrever(lista);
    return novo;
  },

  atualizar(id: string, input: PessoaExtraInput): PessoaExtra | undefined {
    const lista = ler();
    const indice = lista.findIndex((e) => e.id === id);
    if (indice === -1) return undefined;
    const atualizado: PessoaExtra = {
      ...lista[indice],
      ...input,
      nome: input.nome.trim(),
      funcoesSecundarias: input.funcoesSecundarias ?? [],
      documentos: input.documentos ?? lista[indice].documentos ?? [],
      ausencias: input.ausencias ?? lista[indice].ausencias ?? [],
      id,
      atualizadoEm: new Date().toISOString(),
    };
    lista[indice] = atualizado;
    escrever(lista);
    return atualizado;
  },

  excluir(id: string): boolean {
    const lista = ler();
    const filtrada = lista.filter((e) => e.id !== id);
    if (filtrada.length === lista.length) return false;
    escrever(filtrada);
    return true;
  },
};
