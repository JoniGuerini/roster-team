-- Corrige trigger de notificacoes: a tabela usa atualizada_em, não atualizado_em.
-- O trigger errado (set_profiles_updated_at) fazia todo UPDATE falhar silenciosamente
-- no Postgres, impedindo marcar como lida / resolvida / adiar.

drop trigger if exists notificacoes_set_updated_at on public.notificacoes;

create trigger notificacoes_set_updated_at
  before update on public.notificacoes
  for each row execute function public.set_updated_at();
