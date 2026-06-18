-- Modelos de turno por empresa (Fase 4.3)

-- ---------------------------------------------------------------------------
-- Tabela turnos
-- ---------------------------------------------------------------------------
create table if not exists public.turnos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null,
  tipo text not null
    check (tipo in ('regular', 'feriado', 'especial')),
  categoria text not null
    check (categoria in ('manha', 'tarde', 'noite', 'integral', 'outro')),
  local_trabalho text not null
    check (local_trabalho in ('posto-6', 'leme')),
  hora_inicio text not null,
  hora_fim text not null,
  dia_semana_recorrente smallint
    check (dia_semana_recorrente is null or dia_semana_recorrente between 0 and 6),
  necessidades jsonb not null default '[]'::jsonb,
  funcionarios_sugeridos jsonb not null default '[]'::jsonb,
  sugestoes_por_funcao jsonb,
  observacoes text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists turnos_empresa_id_idx
  on public.turnos (empresa_id);

create index if not exists turnos_empresa_tipo_hora_idx
  on public.turnos (empresa_id, tipo, hora_inicio);

drop trigger if exists turnos_set_updated_at on public.turnos;
create trigger turnos_set_updated_at
  before update on public.turnos
  for each row execute function public.set_profiles_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.turnos enable row level security;

create policy "turnos_select"
  on public.turnos for select
  using (
    public.is_platform_admin()
    or (
      empresa_id = public.current_empresa_id()
      and (
        public.profile_tem_permissao('turnos.ver')
        or public.profile_tem_permissao('turnos.editar')
      )
    )
  );

create policy "turnos_insert"
  on public.turnos for insert
  with check (
    public.is_platform_admin()
    or (
      empresa_id = public.current_empresa_id()
      and public.profile_tem_permissao('turnos.editar')
    )
  );

create policy "turnos_update"
  on public.turnos for update
  using (
    public.is_platform_admin()
    or (
      empresa_id = public.current_empresa_id()
      and public.profile_tem_permissao('turnos.editar')
    )
  );

create policy "turnos_delete"
  on public.turnos for delete
  using (
    public.is_platform_admin()
    or (
      empresa_id = public.current_empresa_id()
      and public.profile_tem_permissao('turnos.editar')
    )
  );
