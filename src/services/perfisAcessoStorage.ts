import {
  inputParaPerfilAcessoRow,
  rowParaPerfilAcesso,
} from '../lib/perfilAcessoMappers';
import { supabase } from '../lib/supabase';
import type { PerfilAcesso, PerfilAcessoInput } from '../types/perfilAcesso';

function erroMensagem(erro: { message: string }, fallback: string): string {
  console.error('[perfisAcesso]', erro.message);
  return fallback;
}

export const perfisAcessoStorage = {
  async listarPorEmpresa(empresaId: string): Promise<PerfilAcesso[]> {
    const { data, error } = await supabase
      .from('perfis_acesso')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('ordem', { ascending: true })
      .order('nome', { ascending: true });

    if (error) {
      throw new Error(
        erroMensagem(error, 'Não foi possível carregar os perfis de acesso.'),
      );
    }

    return (data ?? []).map(rowParaPerfilAcesso);
  },

  async obter(id: string): Promise<PerfilAcesso | undefined> {
    const { data, error } = await supabase
      .from('perfis_acesso')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return undefined;
    return rowParaPerfilAcesso(data);
  },

  async criar(
    empresaId: string,
    input: PerfilAcessoInput,
  ): Promise<PerfilAcesso> {
    const { data, error } = await supabase
      .from('perfis_acesso')
      .insert(inputParaPerfilAcessoRow(empresaId, input))
      .select('*')
      .single();

    if (error || !data) {
      const msg = error?.message.toLowerCase() ?? '';
      if (msg.includes('unique') || msg.includes('duplicate')) {
        throw new Error('Já existe um perfil com este nome.');
      }
      throw new Error(
        erroMensagem(
          error ?? { message: 'insert' },
          'Não foi possível criar o perfil.',
        ),
      );
    }

    return rowParaPerfilAcesso(data);
  },

  async atualizar(
    empresaId: string,
    id: string,
    input: PerfilAcessoInput,
  ): Promise<PerfilAcesso> {
    const { data, error } = await supabase
      .from('perfis_acesso')
      .update({
        nome: input.nome.trim(),
        descricao: input.descricao.trim(),
        permissoes: input.permissoes,
      })
      .eq('id', id)
      .eq('empresa_id', empresaId)
      .select('*')
      .single();

    if (error || !data) {
      const msg = error?.message.toLowerCase() ?? '';
      if (msg.includes('unique') || msg.includes('duplicate')) {
        throw new Error('Já existe um perfil com este nome.');
      }
      throw new Error(
        erroMensagem(
          error ?? { message: 'update' },
          'Não foi possível salvar o perfil.',
        ),
      );
    }

    return rowParaPerfilAcesso(data);
  },

  async excluir(empresaId: string, id: string): Promise<void> {
    const perfil = await this.obter(id);
    if (!perfil) {
      throw new Error('Perfil não encontrado.');
    }
    if (perfil.ehSistema) {
      throw new Error('Perfis padrão do sistema não podem ser excluídos.');
    }

    const { count, error: countError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('perfil_acesso_id', id);

    if (countError) {
      throw new Error(
        erroMensagem(countError, 'Não foi possível verificar o uso do perfil.'),
      );
    }

    if ((count ?? 0) > 0) {
      throw new Error(
        'Este perfil está em uso por usuários. Altere o perfil deles antes de excluir.',
      );
    }

    const { error } = await supabase
      .from('perfis_acesso')
      .delete()
      .eq('id', id)
      .eq('empresa_id', empresaId);

    if (error) {
      throw new Error(
        erroMensagem(error, 'Não foi possível excluir o perfil.'),
      );
    }
  },

  async garantirSeed(empresaId: string): Promise<void> {
    const { error } = await supabase.rpc('seed_perfis_acesso_empresa', {
      p_empresa_id: empresaId,
    });

    if (error) {
      console.warn('[perfisAcesso] seed', error.message);
    }
  },
};
