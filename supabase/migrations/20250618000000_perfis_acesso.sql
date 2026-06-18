-- Perfis de acesso personalizáveis por empresa + vínculo em profiles

-- ---------------------------------------------------------------------------
-- Tabela perfis_acesso
-- ---------------------------------------------------------------------------
create table if not exists public.perfis_acesso (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null,
  descricao text not null default '',
  permissoes jsonb not null default '[]'::jsonb,
  eh_sistema boolean not null default false,
  ordem integer not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint perfis_acesso_nome_unico unique (empresa_id, nome)
);

create index if not exists perfis_acesso_empresa_id_idx
  on public.perfis_acesso (empresa_id);

drop trigger if exists perfis_acesso_set_updated_at on public.perfis_acesso;
create trigger perfis_acesso_set_updated_at
  before update on public.perfis_acesso
  for each row execute function public.set_profiles_updated_at();

alter table public.profiles
  add column if not exists perfil_acesso_id uuid
  references public.perfis_acesso (id) on delete set null;

create index if not exists profiles_perfil_acesso_id_idx
  on public.profiles (perfil_acesso_id);

-- ---------------------------------------------------------------------------
-- Helpers de permissão (RLS)
-- ---------------------------------------------------------------------------
create or replace function public.profile_tem_permissao(permissao text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select
        p.is_platform_admin
        or p.permissoes @> to_jsonb(array[permissao]::text[])
      from public.profiles p
      where p.id = auth.uid()
    ),
    false
  );
$$;

revoke all on function public.profile_tem_permissao(text) from public;
revoke all on function public.profile_tem_permissao(text) from anon;
grant execute on function public.profile_tem_permissao(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Seed de perfis padrão por empresa
-- ---------------------------------------------------------------------------
create or replace function public.seed_perfis_acesso_empresa(p_empresa_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.perfis_acesso where empresa_id = p_empresa_id
  ) then
    return;
  end if;

  insert into public.perfis_acesso (empresa_id, nome, descricao, permissoes, eh_sistema, ordem)
  values
    (
      p_empresa_id,
      'Visualizador',
      'Consulta a escala e recebe notificações.',
      '["escala.ver","notificacoes.ver"]'::jsonb,
      true,
      1
    ),
    (
      p_empresa_id,
      'Editor',
      'Monta escala e edita turnos, funcionários e extras.',
      '["escala.ver","escala.editar","turnos.ver","turnos.editar","funcionarios.ver","funcionarios.editar","extras.ver","extras.editar","notificacoes.ver"]'::jsonb,
      true,
      2
    ),
    (
      p_empresa_id,
      'Gerente',
      'Operação completa da cafeteria, sem gestão de usuários.',
      '["escala.ver","escala.editar","turnos.ver","turnos.editar","funcionarios.ver","funcionarios.editar","extras.ver","extras.editar","notificacoes.ver"]'::jsonb,
      true,
      3
    ),
    (
      p_empresa_id,
      'Administrador',
      'Acesso total, incluindo usuários, perfis e configurações.',
      '["escala.ver","escala.editar","turnos.ver","turnos.editar","funcionarios.ver","funcionarios.editar","extras.ver","extras.editar","notificacoes.ver","usuarios.gerir","configuracoes.gerir"]'::jsonb,
      true,
      4
    );
end;
$$;

revoke all on function public.seed_perfis_acesso_empresa(uuid) from public;
grant execute on function public.seed_perfis_acesso_empresa(uuid) to authenticated;

create or replace function public.trg_empresas_seed_perfis_acesso()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_perfis_acesso_empresa(new.id);
  return new;
end;
$$;

drop trigger if exists empresas_seed_perfis_acesso on public.empresas;
create trigger empresas_seed_perfis_acesso
  after insert on public.empresas
  for each row execute function public.trg_empresas_seed_perfis_acesso();

-- Empresas já existentes
do $$
declare
  emp record;
begin
  for emp in select id from public.empresas loop
    perform public.seed_perfis_acesso_empresa(emp.id);
  end loop;
end;
$$;

-- Vincular usuários existentes pelo papel legado
update public.profiles p
set perfil_acesso_id = pa.id
from public.perfis_acesso pa
where p.empresa_id = pa.empresa_id
  and p.perfil_acesso_id is null
  and p.is_platform_admin = false
  and (
    (p.papel = 'colaborador' and pa.nome = 'Visualizador')
    or (p.papel = 'supervisor' and pa.nome = 'Editor')
    or (p.papel = 'gerente' and pa.nome = 'Gerente')
    or (p.papel = 'administrador' and pa.nome = 'Administrador')
  );

-- Quem já geria usuários passa a poder acessar Configurações
update public.profiles
set permissoes = (
  select coalesce(jsonb_agg(to_jsonb(val)), '[]'::jsonb)
  from (
    select distinct jsonb_array_elements_text(permissoes) as val
    union all
    select 'configuracoes.gerir'
  ) s
)
where permissoes @> '["usuarios.gerir"]'::jsonb
  and not permissoes @> '["configuracoes.gerir"]'::jsonb;

-- ---------------------------------------------------------------------------
-- RLS perfis_acesso
-- ---------------------------------------------------------------------------
alter table public.perfis_acesso enable row level security;

create policy "perfis_acesso_select"
  on public.perfis_acesso for select
  using (
    public.is_platform_admin()
    or empresa_id = public.current_empresa_id()
  );

create policy "perfis_acesso_insert"
  on public.perfis_acesso for insert
  with check (
    public.is_platform_admin()
    or (
      empresa_id = public.current_empresa_id()
      and public.profile_tem_permissao('configuracoes.gerir')
    )
  );

create policy "perfis_acesso_update"
  on public.perfis_acesso for update
  using (
    public.is_platform_admin()
    or (
      empresa_id = public.current_empresa_id()
      and public.profile_tem_permissao('configuracoes.gerir')
    )
  );

create policy "perfis_acesso_delete"
  on public.perfis_acesso for delete
  using (
    (
      public.is_platform_admin()
      or (
        empresa_id = public.current_empresa_id()
        and public.profile_tem_permissao('configuracoes.gerir')
      )
    )
    and eh_sistema = false
  );

-- ---------------------------------------------------------------------------
-- RPC vincular usuário (inclui perfil_acesso_id)
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

  return resultado;
end;
$$;

revoke all on function public.admin_vincular_usuario_empresa(
  uuid, uuid, text, text, text, jsonb, text, uuid
) from public;
grant execute on function public.admin_vincular_usuario_empresa(
  uuid, uuid, text, text, text, jsonb, text, uuid
) to authenticated;
