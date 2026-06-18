-- Escala: turnos alocados por dia (Fase 4.4)

-- ---------------------------------------------------------------------------
-- Tabela escala_turnos (cada linha = um TurnoEscalado em uma data)
-- ---------------------------------------------------------------------------
create table if not exists public.escala_turnos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  data date not null,
  turno_id uuid not null references public.turnos (id) on delete cascade,
  alocacoes jsonb not null default '[]'::jsonb,
  observacao text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists escala_turnos_empresa_data_idx
  on public.escala_turnos (empresa_id, data);

create index if not exists escala_turnos_empresa_turno_idx
  on public.escala_turnos (empresa_id, turno_id);

drop trigger if exists escala_turnos_set_updated_at on public.escala_turnos;
create trigger escala_turnos_set_updated_at
  before update on public.escala_turnos
  for each row execute function public.set_profiles_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.escala_turnos enable row level security;

create policy "escala_turnos_select"
  on public.escala_turnos for select
  using (
    public.is_platform_admin()
    or (
      empresa_id = public.current_empresa_id()
      and (
        public.profile_tem_permissao('escala.ver')
        or public.profile_tem_permissao('escala.editar')
      )
    )
  );

create policy "escala_turnos_insert"
  on public.escala_turnos for insert
  with check (
    public.is_platform_admin()
    or (
      empresa_id = public.current_empresa_id()
      and public.profile_tem_permissao('escala.editar')
    )
  );

create policy "escala_turnos_update"
  on public.escala_turnos for update
  using (
    public.is_platform_admin()
    or (
      empresa_id = public.current_empresa_id()
      and public.profile_tem_permissao('escala.editar')
    )
  );

create policy "escala_turnos_delete"
  on public.escala_turnos for delete
  using (
    public.is_platform_admin()
    or (
      empresa_id = public.current_empresa_id()
      and public.profile_tem_permissao('escala.editar')
    )
  );
