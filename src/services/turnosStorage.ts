import type { Turno, TurnoInput } from '../types/turno';

const STORAGE_KEY = 'brisa-cafe:turnos';

function gerarId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function ler(): Turno[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Turno[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Erro ao ler turnos do localStorage', error);
    return [];
  }
}

function escrever(turnos: Turno[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(turnos));
}

const ORDEM_TIPO: Record<Turno['tipo'], number> = {
  regular: 0,
  feriado: 1,
  especial: 2,
};

export const turnosStorage = {
  listar(): Turno[] {
    return ler().sort((a, b) => {
      const ordemTipo = ORDEM_TIPO[a.tipo] - ORDEM_TIPO[b.tipo];
      if (ordemTipo !== 0) return ordemTipo;
      return a.horaInicio.localeCompare(b.horaInicio);
    });
  },

  obter(id: string): Turno | undefined {
    return ler().find((t) => t.id === id);
  },

  criar(input: TurnoInput): Turno {
    const agora = new Date().toISOString();
    const novo: Turno = {
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

  atualizar(id: string, input: TurnoInput): Turno | undefined {
    const lista = ler();
    const indice = lista.findIndex((t) => t.id === id);
    if (indice === -1) return undefined;
    const atualizado: Turno = {
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
    const filtrada = lista.filter((t) => t.id !== id);
    if (filtrada.length === lista.length) return false;
    escrever(filtrada);
    return true;
  },
};
