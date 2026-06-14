import {
  PERMISSOES_POR_PAPEL,
  type Usuario,
  type UsuarioInput,
} from '../types/usuario';

const STORAGE_KEY = 'brisa-cafe:usuarios';

function gerarId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function usuarioInicial(): Usuario {
  const agora = new Date().toISOString();
  return {
    id: gerarId(),
    nome: 'Brisa Café',
    email: 'admin@brisacafe.com',
    papel: 'administrador',
    permissoes: [...PERMISSOES_POR_PAPEL.administrador],
    status: 'ativo',
    senhaDefinidaEm: agora,
    ultimoAcesso: agora,
    criadoEm: agora,
    atualizadoEm: agora,
  };
}

function ler(): Usuario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const inicial = [usuarioInicial()];
      escrever(inicial);
      return inicial;
    }
    const parsed = JSON.parse(raw) as Usuario[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((u) => ({
      ...u,
      permissoes: Array.isArray(u.permissoes) ? u.permissoes : [],
      senhaDefinidaEm: u.senhaDefinidaEm ?? null,
      ultimoAcesso: u.ultimoAcesso ?? null,
    }));
  } catch (error) {
    console.error('Erro ao ler usuários do localStorage', error);
    return [];
  }
}

function escrever(usuarios: Usuario[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usuarios));
}

export const usuariosStorage = {
  listar(): Usuario[] {
    return ler().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  },

  obter(id: string): Usuario | undefined {
    return ler().find((u) => u.id === id);
  },

  criar(input: UsuarioInput): Usuario {
    const agora = new Date().toISOString();
    const novo: Usuario = {
      ...input,
      id: gerarId(),
      senhaDefinidaEm: agora,
      ultimoAcesso: null,
      criadoEm: agora,
      atualizadoEm: agora,
    };
    const lista = ler();
    lista.push(novo);
    escrever(lista);
    return novo;
  },

  atualizar(id: string, input: UsuarioInput): Usuario | undefined {
    const lista = ler();
    const indice = lista.findIndex((u) => u.id === id);
    if (indice === -1) return undefined;
    const atualizado: Usuario = {
      ...lista[indice],
      ...input,
      id,
      atualizadoEm: new Date().toISOString(),
    };
    lista[indice] = atualizado;
    escrever(lista);
    return atualizado;
  },

  /** Marca que uma nova senha foi gerada (mock). */
  registrarSenhaGerada(id: string): Usuario | undefined {
    const lista = ler();
    const indice = lista.findIndex((u) => u.id === id);
    if (indice === -1) return undefined;
    const atualizado: Usuario = {
      ...lista[indice],
      senhaDefinidaEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };
    lista[indice] = atualizado;
    escrever(lista);
    return atualizado;
  },

  excluir(id: string): boolean {
    const lista = ler();
    const filtrada = lista.filter((u) => u.id !== id);
    if (filtrada.length === lista.length) return false;
    escrever(filtrada);
    return true;
  },
};
