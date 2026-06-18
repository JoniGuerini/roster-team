# Roster Team — Gestão de equipe

Aplicação web para gestão de equipe em cafeterias e restaurantes: escala, turnos, funcionários, extras, usuários e administração multi-empresa.

Backend em **[Supabase](https://supabase.com)** (PostgreSQL + Auth + RLS). Frontend em React com roteamento por hash.

## Stack

- [Vite](https://vitejs.dev/) + [React 19](https://react.dev/) + TypeScript
- [Supabase](https://supabase.com) — dados, autenticação e políticas RLS
- CSS customizado (`src/styles/theme.css`)
- Ícones [Tabler Icons](https://tabler.io/icons)

## Como rodar localmente

```bash
npm install
cp .env.example .env.local   # preencha URL e anon key do Supabase
npm run dev
```

Acesse [http://localhost:5173](http://localhost:5173).

Build de produção:

```bash
npm run build
npm run preview
```

## Configuração do Supabase

1. Crie um projeto no [dashboard Supabase](https://supabase.com/dashboard)
2. Configure `.env.local` (ver `.env.example`)
3. Rode as migrations em `supabase/migrations/` (ordem no [ROADMAP](docs/ROADMAP.md) ou use `npm run db:push` após linkar o CLI)
4. Crie o admin da plataforma no Auth e execute o SQL de `is_platform_admin`

Guia completo: **[docs/SUPABASE.md](docs/SUPABASE.md)**

## Deploy

Guia de produção (Vercel, variáveis de ambiente, checklist Auth): **[docs/DEPLOY.md](docs/DEPLOY.md)**

O repositório já inclui `vercel.json` para deploy na Vercel.

## Visão do produto

| Papel | Menu | Função |
|-------|------|--------|
| **Admin da plataforma** | Empresas | CRUD de empresas, recursos e usuários por tenant |
| **Usuário da empresa** | Escala, turnos, equipe… | Operação do dia a dia conforme permissões |

Permissões granulares via **perfis de acesso** personalizáveis por empresa (`#configuracoes`).

## Módulos

| Área | Rotas |
|------|-------|
| Operação | `#escala`, `#turnos`, `#funcionarios`, `#extras`, `#notificacoes` |
| Administração | `#usuarios`, `#configuracoes`, `#atividades` |
| Plataforma | `#empresas`, `#empresas/detalhe/:id` |
| Conta | `#perfil` |

## Estrutura do código

```
src/
├─ components/     # UI, layout, formulários por domínio
├─ pages/          # Uma página por rota principal
├─ services/       # Storages async (Supabase)
├─ lib/            # Mappers row ↔ domínio
├─ types/          # Tipos TypeScript
├─ utils/          # Permissões, datas, regras de escala
├─ hooks/          # Hash route, notificações
└─ dev/            # Seeds de desenvolvimento (somente `npm run dev`)
supabase/migrations/   # Schema SQL versionado
docs/                  # ROADMAP, SUPABASE, DEPLOY
```

## Documentação

- [ROADMAP.md](docs/ROADMAP.md) — estado do projeto e migrations
- [SUPABASE.md](docs/SUPABASE.md) — setup do banco e auth
- [DEPLOY.md](docs/DEPLOY.md) — produção e checklist

## Scripts úteis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build + verificação TypeScript |
| `npm run lint` | ESLint |
| `npm run db:push` | Aplica migrations via Supabase CLI (requer `supabase link`) |
