-- Documentos de funcionários e extras (Supabase Storage)

insert into storage.buckets (id, name, public)
values ('pessoa-documentos', 'pessoa-documentos', false)
on conflict (id) do update set public = false;

-- Caminho: {empresa_id}/{funcionarios|extras}/{pessoa_id}/{documento_id}/{arquivo}

create or replace function public.storage_pessoa_documento_empresa_id(path text)
returns uuid
language sql
immutable
as $$
  select nullif(split_part(path, '/', 1), '')::uuid;
$$;

create or replace function public.storage_pessoa_documento_tipo(path text)
returns text
language sql
immutable
as $$
  select nullif(split_part(path, '/', 2), '');
$$;

create or replace function public.storage_pessoa_documento_pode_ler(path text)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select
    public.is_platform_admin()
    or (
      public.storage_pessoa_documento_empresa_id(path) = public.current_empresa_id()
      and (
        (
          public.storage_pessoa_documento_tipo(path) = 'funcionarios'
          and (
            public.profile_tem_permissao('funcionarios.ver')
            or public.profile_tem_permissao('funcionarios.editar')
          )
        )
        or (
          public.storage_pessoa_documento_tipo(path) = 'extras'
          and (
            public.profile_tem_permissao('extras.ver')
            or public.profile_tem_permissao('extras.editar')
          )
        )
      )
    );
$$;

create or replace function public.storage_pessoa_documento_pode_editar(path text)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select
    public.is_platform_admin()
    or (
      public.storage_pessoa_documento_empresa_id(path) = public.current_empresa_id()
      and (
        (
          public.storage_pessoa_documento_tipo(path) = 'funcionarios'
          and public.profile_tem_permissao('funcionarios.editar')
        )
        or (
          public.storage_pessoa_documento_tipo(path) = 'extras'
          and public.profile_tem_permissao('extras.editar')
        )
      )
    );
$$;

revoke all on function public.storage_pessoa_documento_empresa_id(text) from public;
revoke all on function public.storage_pessoa_documento_tipo(text) from public;
revoke all on function public.storage_pessoa_documento_pode_ler(text) from public;
revoke all on function public.storage_pessoa_documento_pode_editar(text) from public;
grant execute on function public.storage_pessoa_documento_empresa_id(text) to authenticated;
grant execute on function public.storage_pessoa_documento_tipo(text) to authenticated;
grant execute on function public.storage_pessoa_documento_pode_ler(text) to authenticated;
grant execute on function public.storage_pessoa_documento_pode_editar(text) to authenticated;

drop policy if exists "pessoa_documentos_read" on storage.objects;
create policy "pessoa_documentos_read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'pessoa-documentos'
    and public.storage_pessoa_documento_pode_ler(name)
  );

drop policy if exists "pessoa_documentos_insert" on storage.objects;
create policy "pessoa_documentos_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'pessoa-documentos'
    and public.storage_pessoa_documento_pode_editar(name)
  );

drop policy if exists "pessoa_documentos_update" on storage.objects;
create policy "pessoa_documentos_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'pessoa-documentos'
    and public.storage_pessoa_documento_pode_editar(name)
  );

drop policy if exists "pessoa_documentos_delete" on storage.objects;
create policy "pessoa_documentos_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'pessoa-documentos'
    and public.storage_pessoa_documento_pode_editar(name)
  );
