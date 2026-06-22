-- Notificações operacionais por empresa (Fase 5.2)

-- ---------------------------------------------------------------------------
-- Tabela notificacoes
-- ---------------------------------------------------------------------------
create table if not exists public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  chave text not null,
  tipo text not null,
  severidade text not null
    check (severidade in ('alta', 'media', 'baixa')),
  titulo text not null,
  mensagem text not null,
  data date not null,
  funcionario_id uuid,
  turno_escalado_id uuid references public.escala_turnos (id) on delete set null,
  turno_id uuid references public.turnos (id) on delete set null,
  status text not null default 'nao_lida'
    check (status in ('nao_lida', 'lida', 'adiada', 'resolvida')),
  detectada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now(),
  resolvida_em timestamptz,
  snooze_ate date
);

create index if not exists notificacoes_empresa_detectada_idx
  on public.notificacoes (empresa_id, detectada_em desc);

create index if not exists notificacoes_empresa_status_idx
  on public.notificacoes (empresa_id, status);

-- Uma notificação ativa por chave (resolvidas podem repetir a chave no histórico)
create unique index if not exists notificacoes_empresa_chave_ativa_idx
  on public.notificacoes (empresa_id, chave)
  where status <> 'resolvida';

drop trigger if exists notificacoes_set_updated_at on public.notificacoes;
create trigger notificacoes_set_updated_at
  before update on public.notificacoes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.notificacoes enable row level security;

create policy "notificacoes_select"
  on public.notificacoes for select
  using (
    public.is_platform_admin()
    or (
      empresa_id = public.current_empresa_id()
      and public.profile_tem_permissao('notificacoes.ver')
    )
  );

create policy "notificacoes_insert"
  on public.notificacoes for insert
  with check (
    public.is_platform_admin()
    or (
      empresa_id = public.current_empresa_id()
      and public.profile_tem_permissao('notificacoes.ver')
    )
  );

create policy "notificacoes_update"
  on public.notificacoes for update
  using (
    public.is_platform_admin()
    or (
      empresa_id = public.current_empresa_id()
      and public.profile_tem_permissao('notificacoes.ver')
    )
  );

create policy "notificacoes_delete"
  on public.notificacoes for delete
  using (
    public.is_platform_admin()
    or (
      empresa_id = public.current_empresa_id()
      and public.profile_tem_permissao('notificacoes.ver')
    )
  );
