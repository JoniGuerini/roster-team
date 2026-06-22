import { rowParaAtividade } from '../lib/atividadeMappers';
import { supabase } from '../lib/supabase';
import type { Atividade, AtividadeInput } from '../types/atividade';
import { authSession } from './authSession';

const LIMITE = 500;

function erroMensagem(erro: { message: string }, fallback: string): string {
  console.error('[atividades]', erro.message);
  return fallback;
}

function empresaIdAtual(): string {
  const id = authSession.obter()?.empresaId;
  if (!id) {
    throw new Error('Empresa não identificada na sessão.');
  }
  return id;
}

async function autorAtual(): Promise<{
  profileId: string | null;
  nome: string;
  papel: string | null;
}> {
  const sessao = authSession.obter();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user?.id ?? sessao?.userId ?? null;

  if (!userId && !sessao) {
    return { profileId: null, nome: 'Sistema', papel: null };
  }

  return {
    profileId: userId,
    nome: sessao?.nome ?? session?.user?.email ?? 'Sistema',
    papel: sessao ? authSession.rotuloPapel(sessao) : null,
  };
}

export const atividadesStorage = {
  async listar(): Promise<Atividade[]> {
    const empresaId = empresaIdAtual();
    const { data, error } = await supabase
      .from('atividades')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('criado_em', { ascending: false })
      .limit(LIMITE);

    if (error) {
      throw new Error(
        erroMensagem(error, 'Não foi possível carregar as atividades.'),
      );
    }

    return (data ?? []).map(rowParaAtividade);
  },

  async registrar(input: AtividadeInput): Promise<Atividade> {
    const empresaId = empresaIdAtual();
    const autor = await autorAtual();
    const profileId = input.autorProfileId ?? autor.profileId;
    const { data, error } = await supabase
      .from('atividades')
      .insert({
        empresa_id: empresaId,
        autor_profile_id: profileId,
        autor_nome: input.autorNome || autor.nome,
        autor_papel: input.autorPapel ?? autor.papel,
        acao: input.acao,
        modulo: input.modulo,
        alvo: input.alvo,
        detalhe: input.detalhe?.trim() || null,
        criado_em: input.data ?? new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(
        erroMensagem(
          error ?? { message: 'insert' },
          'Não foi possível registrar a atividade.',
        ),
      );
    }

    return rowParaAtividade(data);
  },

  async limpar(): Promise<void> {
    const empresaId = empresaIdAtual();
    const { error } = await supabase
      .from('atividades')
      .delete()
      .eq('empresa_id', empresaId);

    if (error) {
      throw new Error(
        erroMensagem(error, 'Não foi possível limpar as atividades.'),
      );
    }
  },
};

/** Atalho fire-and-forget para registrar atividades a partir dos handlers. */
export function registrarAtividade(input: AtividadeInput): void {
  void atividadesStorage.registrar(input).catch((error) => {
    console.error('[atividades] registrar', error);
  });
}
