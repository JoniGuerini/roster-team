-- Gestão de usuários pelo admin da empresa (usuarios.gerir)

-- ---------------------------------------------------------------------------
-- RLS: listar e editar colegas da mesma empresa
-- ---------------------------------------------------------------------------
create policy "profiles_select_same_empresa"
  on public.profiles for select
  using (
    empresa_id is not null
    and empresa_id = public.current_empresa_id()
  );

create policy "profiles_update_empresa_gerir"
  on public.profiles for update
  using (
    public.profile_tem_permissao('usuarios.gerir')
    and empresa_id = public.current_empresa_id()
    and id <> auth.uid()
    and is_platform_admin = false
  );

-- ---------------------------------------------------------------------------
-- Vincular usuário à própria empresa
-- ---------------------------------------------------------------------------
create or replace function public.empresa_vincular_usuario_empresa(
  target_user_id uuid,
  p_empresa_id uuid,
  p_nome text,
  p_email text,
  p_papel text,
  p_permissoes jsonb,
  p_status text,
  p_perfil_acesso_id uuid default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  resultado public.profiles%rowtype;
begin
  if not public.profile_tem_permissao('usuarios.gerir') then
    raise exception 'Acesso negado';
  end if;

  if p_empresa_id is distinct from public.current_empresa_id() then
    raise exception 'Empresa inválida';
  end if;

  if exists (
    select 1 from public.profiles
    where id = target_user_id and is_platform_admin = true
  ) then
    raise exception 'Não é possível vincular um administrador da plataforma';
  end if;

  if p_perfil_acesso_id is not null and not exists (
    select 1 from public.perfis_acesso
    where id = p_perfil_acesso_id and empresa_id = p_empresa_id
  ) then
    raise exception 'Perfil de acesso inválido para esta empresa';
  end if;

  update public.profiles
  set
    empresa_id = p_empresa_id,
    nome = p_nome,
    email = p_email,
    papel = p_papel,
    permissoes = p_permissoes,
    status = p_status,
    perfil_acesso_id = p_perfil_acesso_id,
    is_platform_admin = false
  where id = target_user_id
  returning * into resultado;

  if not found then
    raise exception 'Usuário não encontrado';
  end if;

  return resultado;
end;
$$;

revoke all on function public.empresa_vincular_usuario_empresa(
  uuid, uuid, text, text, text, jsonb, text, uuid
) from public;
grant execute on function public.empresa_vincular_usuario_empresa(
  uuid, uuid, text, text, text, jsonb, text, uuid
) to authenticated;

-- ---------------------------------------------------------------------------
-- Remover usuário da própria empresa
-- ---------------------------------------------------------------------------
create or replace function public.empresa_remover_usuario(
  target_user_id uuid,
  p_empresa_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  perfil public.profiles%rowtype;
begin
  if not public.profile_tem_permissao('usuarios.gerir') then
    raise exception 'Acesso negado';
  end if;

  if p_empresa_id is distinct from public.current_empresa_id() then
    raise exception 'Empresa inválida';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'Você não pode remover o próprio acesso';
  end if;

  select * into perfil
  from public.profiles
  where id = target_user_id;

  if not found then
    raise exception 'Usuário não encontrado';
  end if;

  if perfil.is_platform_admin then
    raise exception 'Não é possível remover um administrador da plataforma';
  end if;

  if perfil.empresa_id is distinct from p_empresa_id then
    raise exception 'Usuário não pertence a esta empresa';
  end if;

  delete from auth.users where id = target_user_id;
end;
$$;

revoke all on function public.empresa_remover_usuario(uuid, uuid) from public;
grant execute on function public.empresa_remover_usuario(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Redefinir senha provisória (admin da empresa)
-- ---------------------------------------------------------------------------
create or replace function public.empresa_redefinir_senha_usuario(
  target_user_id uuid,
  p_empresa_id uuid,
  nova_senha text
)
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
begin
  if not public.profile_tem_permissao('usuarios.gerir') then
    raise exception 'Acesso negado';
  end if;

  if p_empresa_id is distinct from public.current_empresa_id() then
    raise exception 'Empresa inválida';
  end if;

  if char_length(nova_senha) < 8 then
    raise exception 'Senha deve ter pelo menos 8 caracteres';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = target_user_id
      and empresa_id = p_empresa_id
      and is_platform_admin = false
  ) then
    raise exception 'Usuário não encontrado nesta empresa';
  end if;

  update auth.users
  set
    encrypted_password = extensions.crypt(nova_senha, extensions.gen_salt('bf')),
    updated_at = now()
  where id = target_user_id;

  if not found then
    raise exception 'Usuário de autenticação não encontrado';
  end if;
end;
$$;

revoke all on function public.empresa_redefinir_senha_usuario(
  uuid, uuid, text
) from public;
grant execute on function public.empresa_redefinir_senha_usuario(
  uuid, uuid, text
) to authenticated;
