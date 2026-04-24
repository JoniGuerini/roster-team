import type { Notificacao } from '../types/notificacao';
import { funcionariosStorage } from './funcionariosStorage';
import { turnosStorage } from './turnosStorage';
import { escalaStorage } from './escalaStorage';
import {
  compararParaSync,
  detectarProblemas,
  type ProblemaDetectado,
} from './notificacoesEngine';
import { hojeISO } from '../utils/datas';

const STORAGE_KEY = 'brisa-cafe:notificacoes';

function gerarId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function ler(): Notificacao[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Notificacao[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Erro ao ler notificações do localStorage', error);
    return [];
  }
}

function escrever(lista: Notificacao[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

function notificacaoNova(p: ProblemaDetectado, agora: string): Notificacao {
  return {
    id: gerarId(),
    chave: p.chave,
    tipo: p.tipo,
    severidade: p.severidade,
    titulo: p.titulo,
    mensagem: p.mensagem,
    data: p.data,
    funcionarioId: p.funcionarioId,
    turnoEscaladoId: p.turnoEscaladoId,
    turnoId: p.turnoId,
    status: 'nao_lida',
    detectadaEm: agora,
    atualizadaEm: agora,
  };
}

export const notificacoesStorage = {
  listar(): Notificacao[] {
    return ler().sort((a, b) => {
      const ordemSeveridade: Record<Notificacao['severidade'], number> = {
        alta: 0,
        media: 1,
        baixa: 2,
      };
      const sevDiff =
        ordemSeveridade[a.severidade] - ordemSeveridade[b.severidade];
      if (sevDiff !== 0) return sevDiff;
      return b.detectadaEm.localeCompare(a.detectadaEm);
    });
  },

  contagemNaoLidasAtivas(): number {
    const hoje = hojeISO();
    return ler().filter(
      (n) =>
        n.status === 'nao_lida' &&
        (!n.snoozeAte || n.snoozeAte <= hoje),
    ).length;
  },

  marcarLida(id: string): void {
    const lista = ler();
    const item = lista.find((n) => n.id === id);
    if (!item || item.status === 'resolvida') return;
    item.status = 'lida';
    item.atualizadaEm = new Date().toISOString();
    escrever(lista);
  },

  marcarTodasLidas(): void {
    const lista = ler();
    const agora = new Date().toISOString();
    let mudou = false;
    for (const n of lista) {
      if (n.status === 'nao_lida') {
        n.status = 'lida';
        n.atualizadaEm = agora;
        mudou = true;
      }
    }
    if (mudou) escrever(lista);
  },

  marcarResolvida(id: string): void {
    const lista = ler();
    const item = lista.find((n) => n.id === id);
    if (!item) return;
    const agora = new Date().toISOString();
    item.status = 'resolvida';
    item.resolvidaEm = agora;
    item.atualizadaEm = agora;
    escrever(lista);
  },

  adiar(id: string, ateData: string): void {
    const lista = ler();
    const item = lista.find((n) => n.id === id);
    if (!item) return;
    item.status = 'adiada';
    item.snoozeAte = ateData;
    item.atualizadaEm = new Date().toISOString();
    escrever(lista);
  },

  reabrir(id: string): void {
    const lista = ler();
    const item = lista.find((n) => n.id === id);
    if (!item) return;
    item.status = 'nao_lida';
    item.snoozeAte = undefined;
    item.atualizadaEm = new Date().toISOString();
    escrever(lista);
  },

  excluir(id: string): void {
    escrever(ler().filter((n) => n.id !== id));
  },

  limparResolvidas(): void {
    escrever(ler().filter((n) => n.status !== 'resolvida'));
  },

  sincronizar(): { novas: number; resolvidas: number } {
    const escalas = escalaStorage.listar();
    const turnos = turnosStorage.listar();
    const funcionarios = funcionariosStorage.listar();
    const hoje = hojeISO();
    const agora = new Date().toISOString();

    const problemas = detectarProblemas(escalas, turnos, funcionarios, hoje);
    const persistidas = ler();

    const { novas, resolvidas } = compararParaSync(problemas, persistidas, agora);

    let mudou = false;
    const lista = [...persistidas];

    if (novas.length > 0) {
      mudou = true;
      for (const novo of novas) {
        lista.push(notificacaoNova(novo, agora));
      }
    }

    if (resolvidas.length > 0) {
      mudou = true;
      const resolvidasIds = new Set(resolvidas.map((n) => n.id));
      for (const item of lista) {
        if (resolvidasIds.has(item.id)) {
          item.status = 'resolvida';
          item.resolvidaEm = agora;
          item.atualizadaEm = agora;
        }
      }
    }

    if (mudou) escrever(lista);

    return { novas: novas.length, resolvidas: resolvidas.length };
  },
};
