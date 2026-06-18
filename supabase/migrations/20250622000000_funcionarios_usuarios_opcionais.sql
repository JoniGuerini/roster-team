-- Funcionários: vínculo com usuários + campos opcionais (só nome obrigatório)

-- ---------------------------------------------------------------------------
-- CPF único só quando preenchido (vários sem CPF)
-- ---------------------------------------------------------------------------
alter table public.funcionarios
  drop constraint if exists funcionarios_cpf_unico;

drop index if exists public.funcionarios_empresa_cpf_idx;

create unique index if not exists funcionarios_empresa_cpf_idx
  on public.funcionarios (empresa_id, cpf)
  where cpf is not null and cpf <> '';

-- ---------------------------------------------------------------------------
-- Campos opcionais (exceto nome)
-- ---------------------------------------------------------------------------
alter table public.funcionarios
  alter column cpf drop not null,
  alter column cpf set default null;

alter table public.funcionarios
  alter column local_trabalho drop not null;

alter table public.funcionarios
  alter column tipo_contrato drop not null;

alter table public.funcionarios
  alter column funcao_principal drop not null;

alter table public.funcionarios
  alter column data_admissao drop not null;

alter table public.funcionarios
  alter column status drop not null;

-- ---------------------------------------------------------------------------
-- Vínculo com usuário (profile)
-- ---------------------------------------------------------------------------
alter table public.funcionarios
  add column if not exists profile_id uuid
  references public.profiles (id) on delete set null;

create unique index if not exists funcionarios_profile_id_idx
  on public.funcionarios (profile_id)
  where profile_id is not null;

-- ---------------------------------------------------------------------------
-- Garantir funcionário para cada usuário da empresa
-- ---------------------------------------------------------------------------
create or replace function public.sync_funcionarios_dos_usuarios(p_empresa_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin()
     and p_empresa_id is distinct from public.current_empresa_id() then
    raise exception 'Empresa inválida';
  end if;

  insert into public.funcionarios (empresa_id, nome, profile_id)
  select
    p.empresa_id,
    p.nome,
    p.id
  from public.profiles p
  where p.empresa_id = p_empresa_id
    and p.is_platform_admin = false
    and not exists (
      select 1 from public.funcionarios f where f.profile_id = p.id
    );
end;
$$;

revoke all on function public.sync_funcionarios_dos_usuarios(uuid) from public;
grant execute on function public.sync_funcionarios_dos_usuarios(uuid) to authenticated;
