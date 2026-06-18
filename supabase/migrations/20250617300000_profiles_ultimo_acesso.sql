-- Último acesso (login) do usuário

alter table public.profiles
  add column if not exists ultimo_acesso timestamptz;

create index if not exists profiles_ultimo_acesso_idx
  on public.profiles (ultimo_acesso desc nulls last);
