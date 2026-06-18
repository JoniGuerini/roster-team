-- Admin da plataforma pode redefinir senha de usuário de uma empresa

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
end;
$$;

revoke all on function public.admin_redefinir_senha_usuario(uuid, uuid, text) from public;
grant execute on function public.admin_redefinir_senha_usuario(uuid, uuid, text) to authenticated;
