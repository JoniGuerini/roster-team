-- Ao vincular usuário à empresa, criar/atualizar funcionário com profile_id

-- ---------------------------------------------------------------------------
-- Helper: garante cadastro de equipe para quem tem login
-- ---------------------------------------------------------------------------
create or replace function public.ensure_funcionario_para_profile(
  p_profile_id uuid,
  p_empresa_id uuid,
  p_nome text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_empresa_id is null then
    return;
  end if;

  update public.funcionarios
  set
    nome = trim(p_nome),
    empresa_id = p_empresa_id
  where profile_id = p_profile_id;

  if found then
    return;
  end if;

  insert into public.funcionarios (empresa_id, nome, profile_id)
  values (p_empresa_id, trim(p_nome), p_profile_id);
end;
$$;

revoke all on function public.ensure_funcionario_para_profile(uuid, uuid, text) from public;
grant execute on function public.ensure_funcionario_para_profile(uuid, uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Backfill: usuários já existentes
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select id, empresa_id, nome
    from public.profiles
    where empresa_id is not null
      and is_platform_admin = false
  loop
    perform public.ensure_funcionario_para_profile(r.id, r.empresa_id, r.nome);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- sync legado (mesma lógica do helper)
-- ---------------------------------------------------------------------------
create or replace function public.sync_funcionarios_dos_usuarios(p_empresa_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  if not public.is_platform_admin()
     and p_empresa_id is distinct from public.current_empresa_id() then
    raise exception 'Empresa inválida';
  end if;

  for r in
    select id, empresa_id, nome
    from public.profiles
    where empresa_id = p_empresa_id
      and is_platform_admin = false
  loop
    perform public.ensure_funcionario_para_profile(r.id, r.empresa_id, r.nome);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPCs de vínculo: criar funcionário junto com o profile
-- ---------------------------------------------------------------------------
create or replace function public.admin_vincular_usuario_empresa(
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
  if not public.is_platform_admin() then
    raise exception 'Acesso negado';
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

  perform public.ensure_funcionario_para_profile(
    target_user_id, p_empresa_id, p_nome
  );

  return resultado;
end;
$$;

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

  perform public.ensure_funcionario_para_profile(
    target_user_id, p_empresa_id, p_nome
  );

  return resultado;
end;
$$;
