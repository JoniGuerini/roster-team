-- Corrige erro 500 ao admin vincular/atualizar profiles de outros usuários.
-- Causa: is_platform_admin() SECURITY INVOKER lia profiles dentro da policy de profiles → recursão.

-- ---------------------------------------------------------------------------
-- Helpers: SECURITY DEFINER (leitura sem recursão de RLS)
-- ---------------------------------------------------------------------------
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_platform_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.current_empresa_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select empresa_id from public.profiles where id = auth.uid();
$$;

revoke all on function public.is_platform_admin() from public;
revoke all on function public.is_platform_admin() from anon;
revoke all on function public.current_empresa_id() from public;
revoke all on function public.current_empresa_id() from anon;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.current_empresa_id() to authenticated;

-- ---------------------------------------------------------------------------
-- Vincular usuário recém-criado (ou órfão) a uma empresa
-- ---------------------------------------------------------------------------
create or replace function public.admin_vincular_usuario_empresa(
  target_user_id uuid,
  p_empresa_id uuid,
  p_nome text,
  p_email text,
  p_papel text,
  p_permissoes jsonb,
  p_status text
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

  update public.profiles
  set
    empresa_id = p_empresa_id,
    nome = p_nome,
    email = p_email,
    papel = p_papel,
    permissoes = p_permissoes,
    status = p_status,
    is_platform_admin = false
  where id = target_user_id
  returning * into resultado;

  if not found then
    raise exception 'Usuário não encontrado';
  end if;

  return resultado;
end;
$$;

revoke all on function public.admin_vincular_usuario_empresa(
  uuid, uuid, text, text, text, jsonb, text
) from public;
grant execute on function public.admin_vincular_usuario_empresa(
  uuid, uuid, text, text, text, jsonb, text
) to authenticated;
