-- Evita o mesmo turno-modelo duas vezes no mesmo dia da escala.

delete from public.escala_turnos a
using public.escala_turnos b
where a.empresa_id = b.empresa_id
  and a.data = b.data
  and a.turno_id = b.turno_id
  and a.criado_em > b.criado_em;

create unique index if not exists escala_turnos_empresa_data_turno_unique
  on public.escala_turnos (empresa_id, data, turno_id);
