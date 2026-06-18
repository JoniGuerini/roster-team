-- Senha provisória consultável pelo admin (Auth guarda só o hash)

alter table public.profiles
  add column if not exists senha_provisoria text;

-- ---------------------------------------------------------------------------
-- Vincular usuário: persiste senha provisória
-- ---------------------------------------------------------------------------
drop function if exists public.admin_vincular_usuario_empresa(
  uuid, uuid, text, text, text, jsonb, text
);

create or replace function public.admin_vincular_usuario_empresa(
  target_user_id uuid,
  p_empresa_id uuid,
  p_nome text,
  p_email text,
  p_papel text,
  p_permissoes jsonb,
  p_status text,
  p_senha_provisoria text default null
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
    is_platform_admin = false,
    senha_provisoria = p_senha_provisoria
  where id = target_user_id
  returning * into resultado;

  if not found then
    raise exception 'Usuário não encontrado';
  end if;

  return resultado;
end;
$$;

revoke all on function public.admin_vincular_usuario_empresa(
  uuid, uuid, text, text, text, jsonb, text, text
) from public;
grant execute on function public.admin_vincular_usuario_empresa(
  uuid, uuid, text, text, text, jsonb, text, text
) to authenticated;

-- ---------------------------------------------------------------------------
-- Redefinir senha: atualiza Auth e senha provisória
-- ---------------------------------------------------------------------------
create or replace function public.admin_redefinir_senha_usuario(
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
  if not public.is_platform_admin() then
    raise exception 'Acesso negado';
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

  update public.profiles
  set senha_provisoria = nova_senha
  where id = target_user_id;
end;
$$;
