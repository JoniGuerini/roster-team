-- Brisa Café — correções do Security Advisor (Splinter)
-- Rode no SQL Editor após a migration inicial.

-- ---------------------------------------------------------------------------
-- 1. search_path fixo em funções de trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.atualizada_em = now();
  return new;
end;
$$;

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Helpers de RLS: SECURITY INVOKER (não elevam privilégio desnecessariamente)
--    Leem apenas o próprio profile — permitido pelas policies de profiles.
-- ---------------------------------------------------------------------------
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security invoker
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
security invoker
set search_path = public
as $$
  select empresa_id from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- 3. Revogar EXECUTE público de funções sensíveis
--    Triggers continuam funcionando sem grant explícito ao cliente.
-- ---------------------------------------------------------------------------
revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;

revoke all on function public.is_platform_admin() from public;
revoke all on function public.is_platform_admin() from anon;

revoke all on function public.current_empresa_id() from public;
revoke all on function public.current_empresa_id() from anon;

grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.current_empresa_id() to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Storage: bucket privado (evita listagem pública de arquivos)
--    Logos públicas via URL assinada quando implementarmos upload.
-- ---------------------------------------------------------------------------
update storage.buckets
set public = false
where id = 'empresa-logos';

drop policy if exists "empresa_logos_public_read" on storage.objects;

create policy "empresa_logos_read_admin"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'empresa-logos'
    and public.is_platform_admin()
  );
