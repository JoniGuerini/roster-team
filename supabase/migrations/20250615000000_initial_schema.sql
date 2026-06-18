-- Brisa Café — schema inicial (Fase 1)
-- Rode no SQL Editor do Supabase: https://supabase.com/dashboard → SQL → New query

-- Extensões
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Empresas (tenants)
-- ---------------------------------------------------------------------------
create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  segmento text not null default '',
  logo_url text,
  cor_primaria text not null default '#B8895A',
  owner_nome text not null,
  owner_email text not null,
  status text not null default 'ativa' check (status in ('ativa', 'inativa')),
  recursos jsonb not null default '{
    "escala": true,
    "turnos": true,
    "funcionarios": true,
    "extras": true,
    "notificacoes": true,
    "usuarios": true,
    "atividades": true,
    "relatorios": false
  }'::jsonb,
  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now()
);

create index if not exists empresas_status_idx on public.empresas (status);

-- ---------------------------------------------------------------------------
-- Perfis (1:1 com auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  email text not null,
  empresa_id uuid references public.empresas (id) on delete set null,
  is_platform_admin boolean not null default false,
  papel text check (papel in ('administrador', 'gerente', 'supervisor', 'colaborador')),
  permissoes jsonb not null default '[]'::jsonb,
  status text not null default 'ativo' check (status in ('ativo', 'inativo', 'convite-pendente')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists profiles_empresa_id_idx on public.profiles (empresa_id);
create index if not exists profiles_platform_admin_idx on public.profiles (is_platform_admin);

-- Cria profile automaticamente ao registrar usuário no Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Atualiza updated_at
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

drop trigger if exists empresas_set_updated_at on public.empresas;
create trigger empresas_set_updated_at
  before update on public.empresas
  for each row execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_profiles_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.empresas enable row level security;
alter table public.profiles enable row level security;

-- Helper: usuário é admin da plataforma
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

-- Helper: empresa do usuário logado
create or replace function public.current_empresa_id()
returns uuid
language sql
stable
security invoker
set search_path = public
as $$
  select empresa_id from public.profiles where id = auth.uid();
$$;

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;

revoke all on function public.is_platform_admin() from public;
revoke all on function public.is_platform_admin() from anon;
revoke all on function public.current_empresa_id() from public;
revoke all on function public.current_empresa_id() from anon;

grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.current_empresa_id() to authenticated;

-- Profiles: cada um vê/edita o próprio; admin vê todos
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id or public.is_platform_admin());

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id or public.is_platform_admin());

-- Empresas: admin da plataforma gerencia tudo; usuário da empresa só lê a sua
create policy "empresas_select"
  on public.empresas for select
  using (
    public.is_platform_admin()
    or id = public.current_empresa_id()
  );

create policy "empresas_insert_platform_admin"
  on public.empresas for insert
  with check (public.is_platform_admin());

create policy "empresas_update_platform_admin"
  on public.empresas for update
  using (public.is_platform_admin());

create policy "empresas_delete_platform_admin"
  on public.empresas for delete
  using (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Storage (logos) — opcional na Fase 1
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('empresa-logos', 'empresa-logos', false)
on conflict (id) do update set public = false;

create policy "empresa_logos_read_admin"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'empresa-logos'
    and public.is_platform_admin()
  );

create policy "empresa_logos_admin_write"
  on storage.objects for insert
  with check (
    bucket_id = 'empresa-logos'
    and public.is_platform_admin()
  );

create policy "empresa_logos_admin_update"
  on storage.objects for update
  using (
    bucket_id = 'empresa-logos'
    and public.is_platform_admin()
  );

create policy "empresa_logos_admin_delete"
  on storage.objects for delete
  using (
    bucket_id = 'empresa-logos'
    and public.is_platform_admin()
  );
