# Configuração do Supabase

Guia para sair dos dados mockados (`localStorage`) e usar Supabase como backend.

## 1. Criar o projeto no Supabase

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. **New project** → escolha organização, nome (ex.: `roster-team`) e senha do banco
3. Aguarde o provisionamento (~2 min)

## 2. Pegar as chaves da API

No dashboard do projeto:

**Project Settings → API**

| Campo | Variável no app |
|-------|-----------------|
| Project URL | `VITE_SUPABASE_URL` |
| `anon` `public` key | `VITE_SUPABASE_ANON_KEY` |

> Use só a chave **anon** no frontend. Nunca commite a `service_role`.

## 3. Configurar o ambiente local

Na raiz do repositório:

```bash
cp .env.example .env.local
```

Edite `.env.local` com a URL e a anon key do seu projeto.

Reinicie o dev server:

```bash
npm run dev
```

## 4. Rodar a migration inicial

**Opção A — SQL Editor (mais simples agora)**

1. Dashboard → **SQL** → **New query**
2. Cole o conteúdo de `supabase/migrations/20250615000000_initial_schema.sql`
3. **Run**

**Opção B — Supabase CLI (recomendado depois)**

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

O `project-ref` está na URL do dashboard: `https://supabase.com/dashboard/project/<project-ref>`.

## 5. Criar o primeiro usuário admin da plataforma

1. Dashboard → **Authentication** → **Users** → **Add user**
2. E-mail e senha (ex.: o seu e-mail real)
3. Confirme o e-mail se o projeto exigir confirmação

Depois, no **SQL Editor**, torne esse usuário administrador da plataforma:

```sql
update public.profiles
set
  is_platform_admin = true,
  empresa_id = null,
  papel = 'administrador',
  nome = 'Seu Nome'
where email = 'seu@email.com';
```

Usuários com `is_platform_admin = true` acessam **Empresas** (visão administrativa).  
Usuários com `empresa_id` preenchido acessam a operação daquela empresa.

## 6. O que já está no código

| Área | Arquivos |
|------|----------|
| Cliente Supabase | `src/lib/supabase.ts` |
| Empresas | `src/services/empresasStorage.ts` |
| Usuários | `src/services/profilesStorage.ts` |
| Operação | `funcionariosStorage`, `extrasStorage`, `turnosStorage`, `escalaStorage` |
| Complementos | `atividadesStorage`, `notificacoesStorage` |
| Schema | `supabase/migrations/` (18 arquivos — ver [ROADMAP.md](ROADMAP.md)) |

**Persistência:** todos os módulos operacionais usam Supabase. O único `localStorage` restante guarda a empresa selecionada no painel do admin da plataforma.

## 7. Estado da migração

| Fase | Escopo | Status |
|------|--------|--------|
| 1–2 | Base + Auth | ✅ |
| 3 | Empresas + usuários | ✅ |
| 4 | Funcionários, extras, turnos, escala | ✅ |
| 5 | Atividades, notificações | ✅ |
| 6 | Limpeza de mocks, deploy | ✅ (ver [DEPLOY.md](DEPLOY.md)) |

Deploy: **[docs/DEPLOY.md](DEPLOY.md)**

## 8. Usuários por empresa (Fase 3)

Rode a migration:

`supabase/migrations/20250617000000_empresa_usuarios.sql`

Ela adiciona funções RPC para remover usuários com segurança (`admin_remover_usuario`, `admin_limpar_usuarios_empresa`).

No app, a aba **Usuários** do detalhe da empresa usa `profilesStorage`:

- **Listar** — `profiles` com `empresa_id` da empresa
- **Criar** — `auth.signUp` + atualização do `profile` (a sessão do admin é restaurada)
- **Editar** — atualiza papel, permissões e status no `profile`
- **Excluir** — remove o usuário do Auth (cascade no `profile`)

### Auth: confirmação de e-mail

Em **Authentication → Providers → Email**:

- **Desligado** (dev): o usuário entra imediatamente com a senha gerada
- **Ligado** (produção): use status `Convite pendente` até a pessoa confirmar o e-mail

### Criar usuário de teste de uma empresa

1. Entre como admin da plataforma → **Empresas** → abra uma empresa → aba **Usuários**
2. **Novo usuário** → preencha nome, e-mail, papel e senha
3. Copie a senha do modal e teste login com esse e-mail (em outra aba/anônimo)

## 9. Security Advisor (hardening)

Após a migration inicial, rode também:

`supabase/migrations/20250616000000_security_hardening.sql`

Isso corrige os avisos comuns do Splinter:

| Aviso | Correção |
|-------|----------|
| Function Search Path Mutable | `set search_path = public` nas funções de trigger |
| SECURITY DEFINER exposto | Helpers de RLS viram `SECURITY INVOKER`; `handle_new_user` perde EXECUTE público |
| Public bucket allows listing | Bucket `empresa-logos` vira **privado**; leitura só para admin autenticado |
| Leaked password protection | **Manual no dashboard** (ver abaixo) |

### Ativar proteção de senha vazada (manual)

1. Dashboard → **Authentication** → **Providers** → **Email**
2. Ative **Leaked password protection** (HaveIBeenPwned)
3. Salve

Recomendado em produção; em dev pode ficar desligado se preferir.

Depois de rodar o SQL, clique em **Rerun linter** no Security Advisor.

## 10. Checklist rápido

- [ ] Projeto criado no Supabase
- [ ] `.env.local` com URL e anon key
- [ ] Migrations #1–#18 executadas (ou `npm run db:push`)
- [ ] Migration de security hardening executada
- [ ] Usuário criado no Auth
- [ ] `is_platform_admin = true` no SQL (admin plataforma)
- [ ] Login, empresas e operação funcionando
- [ ] Deploy configurado (ver [DEPLOY.md](DEPLOY.md))
