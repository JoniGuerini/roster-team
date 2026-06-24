-- Novas funções de equipe: cumim, suporte-bebida, suporte-chapa

alter table public.funcionarios
  drop constraint if exists funcionarios_funcao_principal_check;

alter table public.funcionarios
  add constraint funcionarios_funcao_principal_check
  check (
    funcao_principal is null
    or funcao_principal in (
      'atendente',
      'barista',
      'chapeiro',
      'gerente',
      'supervisor',
      'cumim',
      'suporte-bebida',
      'suporte-chapa'
    )
  );

alter table public.extras
  drop constraint if exists extras_funcao_principal_check;

alter table public.extras
  add constraint extras_funcao_principal_check
  check (
    funcao_principal is null
    or funcao_principal in (
      'atendente',
      'barista',
      'chapeiro',
      'gerente',
      'supervisor',
      'cumim',
      'suporte-bebida',
      'suporte-chapa'
    )
  );
