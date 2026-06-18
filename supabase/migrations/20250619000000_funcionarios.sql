-- Funcionários da equipe por empresa (Fase 4.1)

-- ---------------------------------------------------------------------------
-- Tabela funcionarios
-- ---------------------------------------------------------------------------
create table if not exists public.funcionarios (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null,
  cpf text not null default '',
  local_trabalho text not null
    check (local_trabalho in ('posto-6', 'leme')),
  tipo_contrato text not null
    check (tipo_contrato in ('experimental', 'efetivo')),
  funcao_principal text not null
    check (funcao_principal in (
      'atendente', 'barista', 'chapeiro', 'gerente', 'supervisor'
    )),
  funcoes_secundarias jsonb not null default '[]'::jsonb,
  data_admissao date not null,
  status text not null default 'ativo'
    check (status in ('ativo', 'inativo', 'ferias', 'afastado')),
  dia_folga_semanal smallint
    check (dia_folga_semanal is null or dia_folga_semanal between 0 and 6),
  descricao text,
  documentos jsonb not null default '[]'::jsonb,
  ausencias jsonb not null default '[]'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint funcionarios_cpf_unico unique (empresa_id, cpf)
);

create index if not exists funcionarios_empresa_id_idx
  on public.funcionarios (empresa_id);

create index if not exists funcionarios_empresa_nome_idx
  on public.funcionarios (empresa_id, nome);

drop trigger if exists funcionarios_set_updated_at on public.funcionarios;
create trigger funcionarios_set_updated_at
  before update on public.funcionarios
  for each row execute function public.set_profiles_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.funcionarios enable row level security;

create policy "funcionarios_select"
  on public.funcionarios for select
  using (
    public.is_platform_admin()
    or (
      empresa_id = public.current_empresa_id()
      and (
        public.profile_tem_permissao('funcionarios.ver')
        or public.profile_tem_permissao('funcionarios.editar')
      )
    )
  );

create policy "funcionarios_insert"
  on public.funcionarios for insert
  with check (
    public.is_platform_admin()
    or (
      empresa_id = public.current_empresa_id()
      and public.profile_tem_permissao('funcionarios.editar')
    )
  );

create policy "funcionarios_update"
  on public.funcionarios for update
  using (
    public.is_platform_admin()
    or (
      empresa_id = public.current_empresa_id()
      and public.profile_tem_permissao('funcionarios.editar')
    )
  );

create policy "funcionarios_delete"
  on public.funcionarios for delete
  using (
    public.is_platform_admin()
    or (
      empresa_id = public.current_empresa_id()
      and public.profile_tem_permissao('funcionarios.editar')
    )
  );
