import type { PapelUsuario, Permissao } from '../types/usuario';
import { supabase } from '../lib/supabase';
import { labelPapel } from '../utils/usuarioLabels';

export type Sessao = {
  userId: string;
  nome: string;
  email: string;
  papel: PapelUsuario | null;
  perfilAcessoNome: string | null;
  permissoes: Permissao[];
  isPlatformAdmin: boolean;
  empresaId: string | null;
  iniciadaEm: string;
};

export type ResultadoLogin =
  | { ok: true; sessao: Sessao }
  | { ok: false; erro: string };

export type ResultadoAlterarSenha =
  | { ok: true }
  | { ok: false; erro: string };

export type ResultadoAlterarNome =
  | { ok: true; sessao: Sessao }
  | { ok: false; erro: string };

let sessaoCache: Sessao | null = null;

function mapPapel(valor: string | null): PapelUsuario | null {
  if (
    valor === 'administrador' ||
    valor === 'gerente' ||
    valor === 'supervisor' ||
    valor === 'colaborador'
  ) {
    return valor;
  }
  return null;
}

function mapPermissoes(valor: unknown): Permissao[] {
  if (!Array.isArray(valor)) return [];
  return valor.filter((p): p is Permissao => typeof p === 'string');
}

function extrairNomePerfil(
  relacao: { nome: string } | { nome: string }[] | null | undefined,
): string | null {
  if (!relacao) return null;
  if (Array.isArray(relacao)) return relacao[0]?.nome ?? null;
  return relacao.nome ?? null;
}

function montarSessao(
  userId: string,
  email: string,
  profile: {
    nome: string;
    papel: string | null;
    permissoes: unknown;
    is_platform_admin: boolean;
    empresa_id: string | null;
    status: string;
    perfis_acesso?: { nome: string } | { nome: string }[] | null;
  },
): Sessao | null {
  if (profile.status !== 'ativo') {
    return null;
  }

  if (!profile.is_platform_admin && !profile.empresa_id) {
    return null;
  }

  const perfilAcessoNome = extrairNomePerfil(profile.perfis_acesso);

  return {
    userId,
    nome: profile.nome,
    email,
    papel: mapPapel(profile.papel),
    perfilAcessoNome,
    permissoes: mapPermissoes(profile.permissoes),
    isPlatformAdmin: profile.is_platform_admin,
    empresaId: profile.empresa_id,
    iniciadaEm: new Date().toISOString(),
  };
}

async function carregarPerfil(userId: string, email: string): Promise<Sessao | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'nome, papel, permissoes, is_platform_admin, empresa_id, status, perfis_acesso(nome)',
    )
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return montarSessao(userId, email, data);
}

async function registrarUltimoAcesso(userId: string): Promise<void> {
  const agora = new Date().toISOString();
  const { error } = await supabase
    .from('profiles')
    .update({ ultimo_acesso: agora })
    .eq('id', userId);

  if (error) {
    console.warn('[auth] não foi possível registrar último acesso', error.message);
  }
}

export const authSession = {
  obter(): Sessao | null {
    return sessaoCache;
  },

  async carregarSessao(): Promise<Sessao | null> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user.email) {
      sessaoCache = null;
      return null;
    }

    const sessao = await carregarPerfil(session.user.id, session.user.email);
    sessaoCache = sessao;
    return sessao;
  },

  async autenticar(email: string, senha: string): Promise<ResultadoLogin> {
    const e = email.trim().toLowerCase();
    if (!e || !senha) {
      return { ok: false, erro: 'Informe e-mail e senha.' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: e,
      password: senha,
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('invalid login credentials')) {
        return { ok: false, erro: 'E-mail ou senha incorretos.' };
      }
      if (msg.includes('email not confirmed')) {
        return {
          ok: false,
          erro: 'Confirme seu e-mail antes de entrar.',
        };
      }
      return { ok: false, erro: 'Não foi possível entrar. Tente novamente.' };
    }

    const user = data.user;
    if (!user.email) {
      return { ok: false, erro: 'Usuário sem e-mail válido.' };
    }

    const sessao = await carregarPerfil(user.id, user.email);
    if (!sessao) {
      await supabase.auth.signOut();
      return {
        ok: false,
        erro: 'Seu perfil está inativo ou não foi configurado.',
      };
    }

    await registrarUltimoAcesso(user.id);

    sessaoCache = sessao;

    if (sessao.empresaId) {
      void import('./atividadesStorage').then(({ registrarAtividade }) => {
        registrarAtividade({
          acao: 'entrou',
          modulo: 'sessao',
          alvo: '',
          autorProfileId: sessao.userId,
          autorNome: sessao.nome,
          autorPapel: authSession.rotuloPapel(sessao),
        });
      });
    }

    return { ok: true, sessao };
  },

  async sair(): Promise<void> {
    sessaoCache = null;
    await supabase.auth.signOut();
  },

  async alterarSenha(
    senhaAtual: string,
    novaSenha: string,
  ): Promise<ResultadoAlterarSenha> {
    const sessao = sessaoCache;
    if (!sessao) {
      return { ok: false, erro: 'Sessão expirada. Entre novamente.' };
    }

    if (!senhaAtual.trim()) {
      return { ok: false, erro: 'Informe sua senha atual.' };
    }

    if (novaSenha.length < 8) {
      return { ok: false, erro: 'A nova senha deve ter pelo menos 8 caracteres.' };
    }

    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: sessao.email,
      password: senhaAtual,
    });

    if (reauthError) {
      return { ok: false, erro: 'Senha atual incorreta.' };
    }

    const { error } = await supabase.auth.updateUser({ password: novaSenha });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('same') || msg.includes('different')) {
        return { ok: false, erro: 'A nova senha deve ser diferente da atual.' };
      }
      if (msg.includes('weak') || msg.includes('password')) {
        return { ok: false, erro: 'Senha fraca. Escolha uma senha mais forte.' };
      }
      return { ok: false, erro: 'Não foi possível alterar a senha. Tente novamente.' };
    }

    return { ok: true };
  },

  async alterarNome(nome: string): Promise<ResultadoAlterarNome> {
    const sessao = sessaoCache;
    if (!sessao) {
      return { ok: false, erro: 'Sessão expirada. Entre novamente.' };
    }

    const nomeLimpo = nome.trim();
    if (!nomeLimpo) {
      return { ok: false, erro: 'Informe o nome.' };
    }
    if (nomeLimpo.length > 80) {
      return { ok: false, erro: 'Nome muito longo (máx. 80 caracteres).' };
    }

    if (nomeLimpo === sessao.nome) {
      return { ok: true, sessao };
    }

    const { error } = await supabase
      .from('profiles')
      .update({ nome: nomeLimpo })
      .eq('id', sessao.userId);

    if (error) {
      console.warn('[auth] alterar nome', error.message);
      return { ok: false, erro: 'Não foi possível salvar o nome. Tente novamente.' };
    }

    if (sessao.empresaId) {
      const { error: syncError } = await supabase.rpc(
        'ensure_funcionario_para_profile',
        {
          p_profile_id: sessao.userId,
          p_empresa_id: sessao.empresaId,
          p_nome: nomeLimpo,
        },
      );
      if (syncError) {
        console.warn('[auth] sync funcionário', syncError.message);
      }
    }

    const novaSessao: Sessao = { ...sessao, nome: nomeLimpo };
    sessaoCache = novaSessao;
    return { ok: true, sessao: novaSessao };
  },

  rotuloPermissoes(sessao: Sessao | null): string | null {
    if (!sessao) return null;
    if (sessao.isPlatformAdmin) return 'Admin da plataforma';
    if (sessao.perfilAcessoNome) return sessao.perfilAcessoNome;
    return sessao.papel ? labelPapel(sessao.papel) : null;
  },

  rotuloPapel(sessao: Sessao | null): string | null {
    return this.rotuloPermissoes(sessao);
  },
};
