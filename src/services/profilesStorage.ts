import {
  papelLegadoDePerfil,
  rowParaUsuario,
} from '../lib/profileMappers';
import { supabase, supabaseAuthAux } from '../lib/supabase';
import type { Usuario, UsuarioInput } from '../types/usuario';
import { gerarSenha } from '../utils/gerarSenha';
import { authSession } from './authSession';
import { perfisAcessoStorage } from './perfisAcessoStorage';
import { registrarAtividade } from './atividadesStorage';

function erroMensagem(erro: { message: string }, fallback: string): string {
  console.error('[profiles]', erro.message);
  return fallback;
}

function mensagemSignUp(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes('already registered') || msg.includes('already been registered')) {
    return 'Este e-mail já está cadastrado.';
  }
  if (msg.includes('password')) {
    return 'Senha inválida. Use pelo menos 8 caracteres.';
  }
  if (msg.includes('rate limit')) {
    return 'Muitas tentativas. Aguarde um momento e tente novamente.';
  }
  return 'Não foi possível criar o usuário. Tente novamente.';
}

async function resolverPapelLegado(
  empresaId: string,
  perfilAcessoId: string,
): Promise<string> {
  const perfil = await perfisAcessoStorage.obter(perfilAcessoId);
  if (!perfil || perfil.empresaId !== empresaId) {
    throw new Error('Perfil de acesso inválido.');
  }
  return papelLegadoDePerfil(perfil.nome);
}

function exigirPerfilAcessoId(perfilAcessoId: string | null): string {
  if (!perfilAcessoId) {
    throw new Error('Selecione um perfil de permissões.');
  }
  return perfilAcessoId;
}

function usarRpcPlataforma(): boolean {
  return authSession.obter()?.isPlatformAdmin === true;
}

async function vincularPerfilEmpresa(
  userId: string,
  empresaId: string,
  input: UsuarioInput,
): Promise<Usuario> {
  const perfilAcessoId = exigirPerfilAcessoId(input.perfilAcessoId);
  const papel = await resolverPapelLegado(empresaId, perfilAcessoId);

  const args = {
    target_user_id: userId,
    p_empresa_id: empresaId,
    p_nome: input.nome,
    p_email: input.email,
    p_papel: papel,
    p_permissoes: input.permissoes,
    p_status: input.status,
    p_perfil_acesso_id: perfilAcessoId,
  };

  const { data, error } = usarRpcPlataforma()
    ? await supabase.rpc('admin_vincular_usuario_empresa', args)
    : await supabase.rpc('empresa_vincular_usuario_empresa', args);

  if (error || !data) {
    throw new Error(
      erroMensagem(
        error ?? { message: 'vincular' },
        'Não foi possível vincular o usuário à empresa.',
      ),
    );
  }

  return rowParaUsuario(data);
}

const SELECT_COM_PERFIL = '*, perfis_acesso(nome)';

export const profilesStorage = {
  async listarPorEmpresa(empresaId: string): Promise<Usuario[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select(SELECT_COM_PERFIL)
      .eq('empresa_id', empresaId)
      .eq('is_platform_admin', false)
      .order('nome', { ascending: true });

    if (error) {
      throw new Error(
        erroMensagem(error, 'Não foi possível carregar os usuários.'),
      );
    }

    return (data ?? []).map(rowParaUsuario);
  },

  async criarNaEmpresa(
    empresaId: string,
    input: UsuarioInput,
    senha: string,
  ): Promise<Usuario> {
    const { data, error } = await supabaseAuthAux.auth.signUp({
      email: input.email,
      password: senha,
      options: {
        data: { nome: input.nome },
      },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        const existente = await this.obterPorEmail(input.email);
        if (existente && !existente.empresaId) {
          const usuario = await vincularPerfilEmpresa(
            existente.id,
            empresaId,
            input,
          );
          registrarAtividade({
            acao: 'criou',
            modulo: 'usuario',
            alvo: usuario.email,
          });
          return usuario;
        }
      }
      throw new Error(mensagemSignUp(error.message));
    }

    if (!data.user?.id) {
      throw new Error('Cadastro incompleto. Tente novamente.');
    }

    const usuario = await vincularPerfilEmpresa(data.user.id, empresaId, input);
    registrarAtividade({
      acao: 'criou',
      modulo: 'usuario',
      alvo: usuario.email,
    });
    return usuario;
  },

  async obterPorEmail(email: string): Promise<Usuario | undefined> {
    const { data, error } = await supabase
      .from('profiles')
      .select(SELECT_COM_PERFIL)
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (error || !data) return undefined;
    return rowParaUsuario(data);
  },

  async atualizarNaEmpresa(
    empresaId: string,
    id: string,
    input: UsuarioInput,
  ): Promise<Usuario> {
    const perfilAcessoId = exigirPerfilAcessoId(input.perfilAcessoId);
    const papel = await resolverPapelLegado(empresaId, perfilAcessoId);

    const { data, error } = await supabase
      .from('profiles')
      .update({
        nome: input.nome,
        papel,
        permissoes: input.permissoes,
        status: input.status,
        perfil_acesso_id: perfilAcessoId,
      })
      .eq('id', id)
      .eq('empresa_id', empresaId)
      .eq('is_platform_admin', false)
      .select(SELECT_COM_PERFIL)
      .single();

    if (error || !data) {
      throw new Error(
        erroMensagem(
          error ?? { message: 'update' },
          'Não foi possível salvar as alterações.',
        ),
      );
    }

    const { error: syncFuncError } = await supabase.rpc(
      'ensure_funcionario_para_profile',
      {
        p_profile_id: id,
        p_empresa_id: empresaId,
        p_nome: input.nome,
      },
    );
    if (syncFuncError) {
      console.warn('[profiles] funcionário vinculado', syncFuncError.message);
    }

    const usuario = rowParaUsuario(data);
    registrarAtividade({
      acao: 'editou',
      modulo: 'usuario',
      alvo: usuario.email,
    });
    return usuario;
  },

  async gerarNovaSenha(empresaId: string, userId: string): Promise<string> {
    const { data: perfil } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .eq('empresa_id', empresaId)
      .maybeSingle();
    const senha = gerarSenha();
    const args = {
      target_user_id: userId,
      p_empresa_id: empresaId,
      nova_senha: senha,
    };
    const { error } = usarRpcPlataforma()
      ? await supabase.rpc('admin_redefinir_senha_usuario', args)
      : await supabase.rpc('empresa_redefinir_senha_usuario', args);

    if (error) {
      throw new Error(
        erroMensagem(error, 'Não foi possível gerar uma nova senha.'),
      );
    }

    registrarAtividade({
      acao: 'gerou',
      modulo: 'usuario',
      alvo: perfil?.email ?? userId,
    });

    return senha;
  },

  async excluirDaEmpresa(empresaId: string, userId: string): Promise<void> {
    const { data: perfil } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .eq('empresa_id', empresaId)
      .maybeSingle();
    const args = {
      target_user_id: userId,
      p_empresa_id: empresaId,
    };
    const { error } = usarRpcPlataforma()
      ? await supabase.rpc('admin_remover_usuario', args)
      : await supabase.rpc('empresa_remover_usuario', args);

    if (error) {
      throw new Error(
        erroMensagem(error, 'Não foi possível remover o usuário.'),
      );
    }

    registrarAtividade({
      acao: 'excluiu',
      modulo: 'usuario',
      alvo: perfil?.email ?? userId,
    });
  },

  async excluirTodosDaEmpresa(empresaId: string): Promise<number> {
    const { data, error } = await supabase.rpc('admin_limpar_usuarios_empresa', {
      p_empresa_id: empresaId,
    });

    if (error) {
      throw new Error(
        erroMensagem(error, 'Não foi possível remover os usuários.'),
      );
    }

    return typeof data === 'number' ? data : 0;
  },
};
