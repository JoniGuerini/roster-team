-- Fase 3 — gestão de usuários por empresa (profiles + auth)

-- ---------------------------------------------------------------------------
-- Remoção segura de usuários de uma empresa (admin da plataforma)
-- ---------------------------------------------------------------------------
create or replace function public.admin_remover_usuario(
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
  if not public.is_platform_admin() then
    raise exception 'Acesso negado';
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

create or replace function public.admin_limpar_usuarios_empresa(p_empresa_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  removidos integer := 0;
  alvo record;
begin
  if not public.is_platform_admin() then
    raise exception 'Acesso negado';
  end if;

  for alvo in
    select id
    from public.profiles
    where empresa_id = p_empresa_id
      and is_platform_admin = false
  loop
    delete from auth.users where id = alvo.id;
    removidos := removidos + 1;
  end loop;

  return removidos;
end;
$$;

revoke all on function public.admin_remover_usuario(uuid, uuid) from public;
revoke all on function public.admin_limpar_usuarios_empresa(uuid) from public;
grant execute on function public.admin_remover_usuario(uuid, uuid) to authenticated;
grant execute on function public.admin_limpar_usuarios_empresa(uuid) to authenticated;
