-- Histórico de atividades / auditoria por empresa (Fase 5.1)

-- ---------------------------------------------------------------------------
-- Tabela atividades
-- ---------------------------------------------------------------------------
create table if not exists public.atividades (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  autor_profile_id uuid references public.profiles (id) on delete set null,
  autor_nome text not null,
  autor_papel text,
  acao text not null
    check (acao in ('criou', 'editou', 'excluiu', 'gerou', 'entrou')),
  modulo text not null
    check (modulo in (
      'funcionario', 'extra', 'turno', 'escala', 'usuario', 'sessao'
    )),
  alvo text not null default '',
  detalhe text,
  criado_em timestamptz not null default now()
);

create index if not exists atividades_empresa_criado_idx
  on public.atividades (empresa_id, criado_em desc);

create index if not exists atividades_empresa_modulo_idx
  on public.atividades (empresa_id, modulo);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.atividades enable row level security;

create policy "atividades_select"
  on public.atividades for select
  using (
    public.is_platform_admin()
    or empresa_id = public.current_empresa_id()
  );

create policy "atividades_insert"
  on public.atividades for insert
  with check (
    public.is_platform_admin()
    or empresa_id = public.current_empresa_id()
  );

create policy "atividades_delete"
  on public.atividades for delete
  using (
    public.is_platform_admin()
    or (
      empresa_id = public.current_empresa_id()
      and (
        public.profile_tem_permissao('usuarios.gerir')
        or public.profile_tem_permissao('configuracoes.gerir')
      )
    )
  );
