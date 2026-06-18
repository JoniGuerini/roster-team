-- Extras (pessoas pontuais) por empresa (Fase 4.2)

-- ---------------------------------------------------------------------------
-- Tabela extras
-- ---------------------------------------------------------------------------
create table if not exists public.extras (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null,
  cpf text,
  local_trabalho text
    check (local_trabalho is null or local_trabalho in ('posto-6', 'leme')),
  tipo_contrato text
    check (tipo_contrato is null or tipo_contrato in ('experimental', 'efetivo')),
  funcao_principal text
    check (funcao_principal is null or funcao_principal in (
      'atendente', 'barista', 'chapeiro', 'gerente', 'supervisor'
    )),
  funcoes_secundarias jsonb not null default '[]'::jsonb,
  data_admissao date,
  status text
    check (status is null or status in ('ativo', 'inativo', 'ferias', 'afastado')),
  dia_folga_semanal smallint
    check (dia_folga_semanal is null or dia_folga_semanal between 0 and 6),
  descricao text,
  documentos jsonb not null default '[]'::jsonb,
  ausencias jsonb not null default '[]'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists extras_empresa_id_idx
  on public.extras (empresa_id);

create index if not exists extras_empresa_nome_idx
  on public.extras (empresa_id, nome);

create unique index if not exists extras_empresa_cpf_idx
  on public.extras (empresa_id, cpf)
  where cpf is not null and cpf <> '';

drop trigger if exists extras_set_updated_at on public.extras;
create trigger extras_set_updated_at
  before update on public.extras
  for each row execute function public.set_profiles_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.extras enable row level security;

create policy "extras_select"
  on public.extras for select
  using (
    public.is_platform_admin()
    or (
      empresa_id = public.current_empresa_id()
      and (
        public.profile_tem_permissao('extras.ver')
        or public.profile_tem_permissao('extras.editar')
      )
    )
  );

create policy "extras_insert"
  on public.extras for insert
  with check (
    public.is_platform_admin()
    or (
      empresa_id = public.current_empresa_id()
      and public.profile_tem_permissao('extras.editar')
    )
  );

create policy "extras_update"
  on public.extras for update
  using (
    public.is_platform_admin()
    or (
      empresa_id = public.current_empresa_id()
      and public.profile_tem_permissao('extras.editar')
    )
  );

create policy "extras_delete"
  on public.extras for delete
  using (
    public.is_platform_admin()
    or (
      empresa_id = public.current_empresa_id()
      and public.profile_tem_permissao('extras.editar')
    )
  );
