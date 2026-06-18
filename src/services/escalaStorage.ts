import {
  alocacoesParaJson,
  rowParaTurnoEscalado,
  rowsParaEscalas,
} from '../lib/escalaMappers';
import { supabase } from '../lib/supabase';
import type { AlocacaoFuncao, EscalaDia, TurnoEscalado } from '../types/escala';
import type { Turno } from '../types/turno';
import { diaSemanaDe, diasNoIntervalo } from '../utils/datas';
import { authSession } from './authSession';
import { registrarAtividade } from './atividadesStorage';

function erroMensagem(erro: { message: string }, fallback: string): string {
  console.error('[escala]', erro.message);
  return fallback;
}

function empresaIdAtual(): string {
  const id = authSession.obter()?.empresaId;
  if (!id) {
    throw new Error('Empresa não identificada na sessão.');
  }
  return id;
}

async function carregarRows(
  empresaId: string,
  filtro?: { inicio?: string; fim?: string },
) {
  let query = supabase
    .from('escala_turnos')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('data', { ascending: true })
    .order('criado_em', { ascending: true });

  if (filtro?.inicio) {
    query = query.gte('data', filtro.inicio);
  }
  if (filtro?.fim) {
    query = query.lte('data', filtro.fim);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(
      erroMensagem(error, 'Não foi possível carregar a escala.'),
    );
  }
  return data ?? [];
}

export const escalaStorage = {
  async listar(): Promise<EscalaDia[]> {
    const empresaId = empresaIdAtual();
    const rows = await carregarRows(empresaId);
    return rowsParaEscalas(rows);
  },

  async obterDia(data: string): Promise<EscalaDia> {
    const empresaId = empresaIdAtual();
    const rows = await carregarRows(empresaId, { inicio: data, fim: data });
    const escalas = rowsParaEscalas(rows);
    return escalas[0] ?? { data, turnos: [] };
  },

  async obterIntervalo(inicio: string, fim: string): Promise<EscalaDia[]> {
    const empresaId = empresaIdAtual();
    const rows = await carregarRows(empresaId, { inicio, fim });
    return rowsParaEscalas(rows);
  },

  async sincronizarTurnosRecorrentes(
    inicio: string,
    fim: string,
    turnos: Turno[],
    obterAlocacoes: (turno: Turno, data: string) => AlocacaoFuncao[],
  ): Promise<number> {
    const empresaId = empresaIdAtual();
    const existentes = await this.obterIntervalo(inicio, fim);
    const idsPorDia = new Map<string, Set<string>>();
    for (const dia of existentes) {
      idsPorDia.set(
        dia.data,
        new Set(dia.turnos.map((t) => t.turnoId)),
      );
    }

    const agora = new Date().toISOString();
    const inserts: {
      empresa_id: string;
      data: string;
      turno_id: string;
      alocacoes: ReturnType<typeof alocacoesParaJson>;
      criado_em: string;
      atualizado_em: string;
    }[] = [];

    for (const data of diasNoIntervalo(inicio, fim)) {
      const presentes = idsPorDia.get(data) ?? new Set<string>();
      for (const turno of turnos) {
        if (!turno.ativo || turno.tipo !== 'regular') continue;
        const dsr = turno.diaSemanaRecorrente;
        if (dsr == null || dsr < 0 || dsr > 6) continue;
        if (diaSemanaDe(data) !== dsr) continue;
        if (presentes.has(turno.id)) continue;

        const alocacoes = obterAlocacoes(turno, data);
        inserts.push({
          empresa_id: empresaId,
          data,
          turno_id: turno.id,
          alocacoes: alocacoesParaJson(alocacoes),
          criado_em: agora,
          atualizado_em: agora,
        });
        presentes.add(turno.id);
        idsPorDia.set(data, presentes);
      }
    }

    if (inserts.length === 0) return 0;

    const { error } = await supabase.from('escala_turnos').insert(inserts);
    if (error) {
      throw new Error(
        erroMensagem(error, 'Não foi possível sincronizar turnos recorrentes.'),
      );
    }

    return inserts.length;
  },

  async adicionarTurno(
    data: string,
    turnoId: string,
    alocacoes: AlocacaoFuncao[],
  ): Promise<TurnoEscalado> {
    const empresaId = empresaIdAtual();
    const { data: row, error } = await supabase
      .from('escala_turnos')
      .insert({
        empresa_id: empresaId,
        data,
        turno_id: turnoId,
        alocacoes: alocacoesParaJson(alocacoes),
      })
      .select('*')
      .single();

    if (error || !row) {
      throw new Error(
        erroMensagem(
          error ?? { message: 'insert' },
          'Não foi possível adicionar o turno à escala.',
        ),
      );
    }

    registrarAtividade({
      acao: 'editou',
      modulo: 'escala',
      alvo: data,
      detalhe: 'turno adicionado',
    });

    return rowParaTurnoEscalado(row);
  },

  async atualizarTurno(
    data: string,
    turnoEscaladoId: string,
    patch: Partial<Pick<TurnoEscalado, 'alocacoes' | 'observacao'>>,
  ): Promise<TurnoEscalado | undefined> {
    const empresaId = empresaIdAtual();
    const update: {
      alocacoes?: ReturnType<typeof alocacoesParaJson>;
      observacao?: string | null;
    } = {};

    if (patch.alocacoes) {
      update.alocacoes = alocacoesParaJson(patch.alocacoes);
    }
    if (patch.observacao !== undefined) {
      update.observacao = patch.observacao?.trim() || null;
    }

    const { data: row, error } = await supabase
      .from('escala_turnos')
      .update(update)
      .eq('id', turnoEscaladoId)
      .eq('empresa_id', empresaId)
      .eq('data', data)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new Error(
        erroMensagem(error, 'Não foi possível atualizar a escala.'),
      );
    }

    if (row) {
      registrarAtividade({
        acao: 'editou',
        modulo: 'escala',
        alvo: data,
      });
    }

    return row ? rowParaTurnoEscalado(row) : undefined;
  },

  async removerTurno(data: string, turnoEscaladoId: string): Promise<boolean> {
    const empresaId = empresaIdAtual();
    const { error, count } = await supabase
      .from('escala_turnos')
      .delete({ count: 'exact' })
      .eq('id', turnoEscaladoId)
      .eq('empresa_id', empresaId)
      .eq('data', data);

    if (error) {
      throw new Error(
        erroMensagem(error, 'Não foi possível remover o turno da escala.'),
      );
    }

    if ((count ?? 0) > 0) {
      registrarAtividade({
        acao: 'editou',
        modulo: 'escala',
        alvo: data,
        detalhe: 'turno removido',
      });
    }

    return (count ?? 0) > 0;
  },

  async removerReferenciasTurno(turnoId: string): Promise<number> {
    const empresaId = empresaIdAtual();
    const { error, count } = await supabase
      .from('escala_turnos')
      .delete({ count: 'exact' })
      .eq('empresa_id', empresaId)
      .eq('turno_id', turnoId);

    if (error) {
      throw new Error(
        erroMensagem(
          error,
          'Não foi possível remover as ocorrências do turno na escala.',
        ),
      );
    }

    return count ?? 0;
  },

  async limparOrfaos(turnosIds: string[]): Promise<number> {
    const empresaId = empresaIdAtual();
    const rows = await carregarRows(empresaId);
    const validos = new Set(turnosIds);
    const idsRemover = rows
      .filter((r) => !validos.has(r.turno_id))
      .map((r) => r.id);

    if (idsRemover.length === 0) return 0;

    const { error, count } = await supabase
      .from('escala_turnos')
      .delete({ count: 'exact' })
      .eq('empresa_id', empresaId)
      .in('id', idsRemover);

    if (error) {
      throw new Error(
        erroMensagem(error, 'Não foi possível limpar alocações órfãs.'),
      );
    }

    return count ?? 0;
  },
};
