import {
  ordenarNotificacoes,
  rowParaNotificacao,
} from '../lib/notificacaoMappers';
import { supabase } from '../lib/supabase';
import type { Notificacao } from '../types/notificacao';
import { hojeISO } from '../utils/datas';
import { funcionariosStorage } from './funcionariosStorage';
import { extrasStorage } from './extrasStorage';
import { turnosStorage } from './turnosStorage';
import { escalaStorage } from './escalaStorage';
import {
  compararParaSync,
  detectarProblemas,
  type ProblemaDetectado,
} from './notificacoesEngine';
import { authSession } from './authSession';

function erroMensagem(erro: { message: string }, fallback: string): string {
  console.error('[notificacoes]', erro.message);
  return fallback;
}

function empresaIdAtual(): string {
  const id = authSession.obter()?.empresaId;
  if (!id) {
    throw new Error('Empresa não identificada na sessão.');
  }
  return id;
}

function rowInsertDeProblema(
  empresaId: string,
  p: ProblemaDetectado,
  agora: string,
) {
  return {
    empresa_id: empresaId,
    chave: p.chave,
    tipo: p.tipo,
    severidade: p.severidade,
    titulo: p.titulo,
    mensagem: p.mensagem,
    data: p.data,
    funcionario_id: p.funcionarioId ?? null,
    turno_escalado_id: p.turnoEscaladoId ?? null,
    turno_id: p.turnoId ?? null,
    status: 'nao_lida' as const,
    detectada_em: agora,
    atualizada_em: agora,
  };
}

export const notificacoesStorage = {
  async listar(): Promise<Notificacao[]> {
    const empresaId = empresaIdAtual();
    const { data, error } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('empresa_id', empresaId);

    if (error) {
      throw new Error(
        erroMensagem(error, 'Não foi possível carregar as notificações.'),
      );
    }

    return ordenarNotificacoes((data ?? []).map(rowParaNotificacao));
  },

  async contagemNaoLidasAtivas(): Promise<number> {
    const hoje = hojeISO();
    const lista = await this.listar();
    return lista.filter(
      (n) =>
        n.status === 'nao_lida' && (!n.snoozeAte || n.snoozeAte <= hoje),
    ).length;
  },

  async marcarLida(id: string): Promise<void> {
    const empresaId = empresaIdAtual();
    const agora = new Date().toISOString();
    const { data, error } = await supabase
      .from('notificacoes')
      .update({ status: 'lida', atualizada_em: agora })
      .eq('id', id)
      .eq('empresa_id', empresaId)
      .neq('status', 'resolvida')
      .select('id');

    if (error) {
      throw new Error(
        erroMensagem(error, 'Não foi possível marcar a notificação como lida.'),
      );
    }
    if (!data?.length) {
      throw new Error(
        'Não foi possível marcar a notificação como lida (nenhum registro atualizado).',
      );
    }
  },

  async marcarTodasLidas(): Promise<void> {
    const empresaId = empresaIdAtual();
    const agora = new Date().toISOString();
    const { data, error } = await supabase
      .from('notificacoes')
      .update({ status: 'lida', atualizada_em: agora })
      .eq('empresa_id', empresaId)
      .eq('status', 'nao_lida')
      .select('id');

    if (error) {
      throw new Error(
        erroMensagem(
          error,
          'Não foi possível marcar todas as notificações como lidas.',
        ),
      );
    }
    if (!data?.length) {
      throw new Error(
        'Nenhuma notificação foi atualizada. Verifique se ainda há itens não lidos.',
      );
    }
  },

  async marcarResolvida(id: string): Promise<void> {
    const empresaId = empresaIdAtual();
    const agora = new Date().toISOString();
    const { error } = await supabase
      .from('notificacoes')
      .update({
        status: 'resolvida',
        resolvida_em: agora,
        atualizada_em: agora,
      })
      .eq('id', id)
      .eq('empresa_id', empresaId);

    if (error) {
      throw new Error(
        erroMensagem(error, 'Não foi possível resolver a notificação.'),
      );
    }
  },

  async adiar(id: string, ateData: string): Promise<void> {
    const empresaId = empresaIdAtual();
    const agora = new Date().toISOString();
    const { error } = await supabase
      .from('notificacoes')
      .update({
        status: 'adiada',
        snooze_ate: ateData,
        atualizada_em: agora,
      })
      .eq('id', id)
      .eq('empresa_id', empresaId);

    if (error) {
      throw new Error(
        erroMensagem(error, 'Não foi possível adiar a notificação.'),
      );
    }
  },

  async reabrir(id: string): Promise<void> {
    const empresaId = empresaIdAtual();
    const agora = new Date().toISOString();
    const { error } = await supabase
      .from('notificacoes')
      .update({
        status: 'nao_lida',
        snooze_ate: null,
        resolvida_em: null,
        atualizada_em: agora,
      })
      .eq('id', id)
      .eq('empresa_id', empresaId);

    if (error) {
      throw new Error(
        erroMensagem(error, 'Não foi possível reabrir a notificação.'),
      );
    }
  },

  async excluir(id: string): Promise<void> {
    const empresaId = empresaIdAtual();
    const { error } = await supabase
      .from('notificacoes')
      .delete()
      .eq('id', id)
      .eq('empresa_id', empresaId);

    if (error) {
      throw new Error(
        erroMensagem(error, 'Não foi possível excluir a notificação.'),
      );
    }
  },

  async limparResolvidas(): Promise<void> {
    const empresaId = empresaIdAtual();
    const { error } = await supabase
      .from('notificacoes')
      .delete()
      .eq('empresa_id', empresaId)
      .eq('status', 'resolvida');

    if (error) {
      throw new Error(
        erroMensagem(
          error,
          'Não foi possível limpar as notificações resolvidas.',
        ),
      );
    }
  },

  async sincronizar(): Promise<{ novas: number; resolvidas: number }> {
    const empresaId = empresaIdAtual();

    let escalas: Awaited<ReturnType<typeof escalaStorage.listar>> = [];
    try {
      escalas = await escalaStorage.listar();
    } catch (error) {
      console.error('[notificacoes] escala', error);
    }
    let turnos: Awaited<ReturnType<typeof turnosStorage.listar>> = [];
    try {
      turnos = await turnosStorage.listar();
    } catch (error) {
      console.error('[notificacoes] turnos', error);
    }
    let funcionarios: Awaited<ReturnType<typeof funcionariosStorage.listar>> =
      [];
    try {
      funcionarios = await funcionariosStorage.listar();
    } catch (error) {
      console.error('[notificacoes] funcionários', error);
    }
    let extras: Awaited<ReturnType<typeof extrasStorage.listar>> = [];
    try {
      extras = await extrasStorage.listar();
    } catch (error) {
      console.error('[notificacoes] extras', error);
    }

    const hoje = hojeISO();
    const agora = new Date().toISOString();
    const problemas = detectarProblemas(
      escalas,
      turnos,
      funcionarios,
      extras,
      hoje,
    );

    const persistidas = await this.listar();
    const { novas, resolvidas } = compararParaSync(
      problemas,
      persistidas,
      agora,
    );

    if (novas.length > 0) {
      const { error } = await supabase
        .from('notificacoes')
        .insert(novas.map((p) => rowInsertDeProblema(empresaId, p, agora)));

      if (error) {
        throw new Error(
          erroMensagem(error, 'Não foi possível registrar novas notificações.'),
        );
      }
    }

    if (resolvidas.length > 0) {
      const ids = resolvidas.map((n) => n.id);
      const { error } = await supabase
        .from('notificacoes')
        .update({
          status: 'resolvida',
          resolvida_em: agora,
          atualizada_em: agora,
        })
        .eq('empresa_id', empresaId)
        .in('id', ids);

      if (error) {
        throw new Error(
          erroMensagem(
            error,
            'Não foi possível atualizar notificações resolvidas.',
          ),
        );
      }
    }

    return { novas: novas.length, resolvidas: resolvidas.length };
  },
};
