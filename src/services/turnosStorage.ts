import { inputParaTurnoRow, rowParaTurno } from '../lib/turnoMappers';
import { supabase } from '../lib/supabase';
import type { Turno, TurnoInput } from '../types/turno';
import { authSession } from './authSession';
import { registrarAtividade } from './atividadesStorage';

const ORDEM_TIPO: Record<Turno['tipo'], number> = {
  regular: 0,
  feriado: 1,
  especial: 2,
};

function erroMensagem(erro: { message: string }, fallback: string): string {
  console.error('[turnos]', erro.message);
  return fallback;
}

function empresaIdAtual(): string {
  const id = authSession.obter()?.empresaId;
  if (!id) {
    throw new Error('Empresa não identificada na sessão.');
  }
  return id;
}

function ordenarTurnos(turnos: Turno[]): Turno[] {
  return [...turnos].sort((a, b) => {
    const ordemTipo = ORDEM_TIPO[a.tipo] - ORDEM_TIPO[b.tipo];
    if (ordemTipo !== 0) return ordemTipo;
    return a.horaInicio.localeCompare(b.horaInicio);
  });
}

export const turnosStorage = {
  async listar(): Promise<Turno[]> {
    const empresaId = empresaIdAtual();
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('empresa_id', empresaId);

    if (error) {
      throw new Error(
        erroMensagem(error, 'Não foi possível carregar os turnos.'),
      );
    }

    return ordenarTurnos((data ?? []).map(rowParaTurno));
  },

  async obter(id: string): Promise<Turno | undefined> {
    const empresaId = empresaIdAtual();
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('id', id)
      .eq('empresa_id', empresaId)
      .maybeSingle();

    if (error || !data) return undefined;
    return rowParaTurno(data);
  },

  async criar(input: TurnoInput): Promise<Turno> {
    const empresaId = empresaIdAtual();
    const { data, error } = await supabase
      .from('turnos')
      .insert(inputParaTurnoRow(empresaId, input))
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(
        erroMensagem(
          error ?? { message: 'insert' },
          'Não foi possível criar o turno.',
        ),
      );
    }

    const turno = rowParaTurno(data);
    registrarAtividade({
      acao: 'criou',
      modulo: 'turno',
      alvo: turno.nome,
    });
    return turno;
  },

  async atualizar(id: string, input: TurnoInput): Promise<Turno | undefined> {
    const empresaId = empresaIdAtual();
    const row = inputParaTurnoRow(empresaId, input);
    const { data, error } = await supabase
      .from('turnos')
      .update({
        nome: row.nome,
        tipo: row.tipo,
        categoria: row.categoria,
        local_trabalho: row.local_trabalho,
        hora_inicio: row.hora_inicio,
        hora_fim: row.hora_fim,
        dia_semana_recorrente: row.dia_semana_recorrente,
        necessidades: row.necessidades,
        funcionarios_sugeridos: row.funcionarios_sugeridos,
        sugestoes_por_funcao: row.sugestoes_por_funcao,
        observacoes: row.observacoes,
        ativo: row.ativo,
      })
      .eq('id', id)
      .eq('empresa_id', empresaId)
      .select('*')
      .single();

    if (error || !data) {
      if (error) {
        throw new Error(
          erroMensagem(error, 'Não foi possível salvar o turno.'),
        );
      }
      return undefined;
    }

    const turno = rowParaTurno(data);
    registrarAtividade({
      acao: 'editou',
      modulo: 'turno',
      alvo: turno.nome,
    });
    return turno;
  },

  async excluir(id: string): Promise<boolean> {
    const empresaId = empresaIdAtual();
    const existente = await this.obter(id);
    const { error, count } = await supabase
      .from('turnos')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('empresa_id', empresaId);

    if (error) {
      throw new Error(
        erroMensagem(error, 'Não foi possível excluir o turno.'),
      );
    }

    if ((count ?? 0) > 0 && existente) {
      registrarAtividade({
        acao: 'excluiu',
        modulo: 'turno',
        alvo: existente.nome,
      });
    }

    return (count ?? 0) > 0;
  },
};
