import type { Funcionario, FuncionarioInput } from '../types/funcionario';

const STORAGE_KEY = 'brisa-cafe:funcionarios';

function gerarId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function ler(): Funcionario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Funcionario[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((f) => ({
      ...f,
      ausencias: Array.isArray(f.ausencias) ? f.ausencias : [],
      documentos: Array.isArray(f.documentos) ? f.documentos : [],
      funcoesSecundarias: Array.isArray(f.funcoesSecundarias)
        ? f.funcoesSecundarias
        : [],
    }));
  } catch (error) {
    console.error('Erro ao ler funcionários do localStorage', error);
    return [];
  }
}

function escrever(funcionarios: Funcionario[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(funcionarios));
}

export const funcionariosStorage = {
  listar(): Funcionario[] {
    return ler().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  },

  obter(id: string): Funcionario | undefined {
    return ler().find((f) => f.id === id);
  },

  criar(input: FuncionarioInput): Funcionario {
    const agora = new Date().toISOString();
    const novo: Funcionario = {
      ...input,
      id: gerarId(),
      criadoEm: agora,
      atualizadoEm: agora,
    };
    const lista = ler();
    lista.push(novo);
    escrever(lista);
    return novo;
  },

  atualizar(id: string, input: FuncionarioInput): Funcionario | undefined {
    const lista = ler();
    const indice = lista.findIndex((f) => f.id === id);
    if (indice === -1) return undefined;
    const atualizado: Funcionario = {
      ...lista[indice],
      ...input,
      id,
      atualizadoEm: new Date().toISOString(),
    };
    lista[indice] = atualizado;
    escrever(lista);
    return atualizado;
  },

  excluir(id: string): boolean {
    const lista = ler();
    const filtrada = lista.filter((f) => f.id !== id);
    if (filtrada.length === lista.length) return false;
    escrever(filtrada);
    return true;
  },
};
