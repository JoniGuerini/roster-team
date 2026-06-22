-- Permite recorrência diária em turnos regulares (-1 = todo dia na escala).

alter table public.turnos
  drop constraint if exists turnos_dia_semana_recorrente_check;

alter table public.turnos
  add constraint turnos_dia_semana_recorrente_check
  check (dia_semana_recorrente is null or dia_semana_recorrente between -1 and 6);
