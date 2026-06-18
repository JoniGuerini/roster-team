# Deploy em produção — Roster Team

Checklist para publicar o app e endurecer o ambiente Supabase.

## 1. Pré-requisitos

- [ ] Todas as migrations (#1–#18) aplicadas no projeto Supabase de produção
- [ ] Admin da plataforma criado (`is_platform_admin = true`)
- [ ] Pelo menos uma empresa e usuários de teste validados em staging

## 2. Variáveis de ambiente

No host (ex.: **Vercel → Settings → Environment Variables**):

| Variável | Ambiente | Valor |
|----------|----------|-------|
| `VITE_SUPABASE_URL` | Production | `https://SEU_REF.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Production | Chave **anon** / publishable do projeto |

> Use um projeto Supabase **separado** para produção e outro para desenvolvimento.

Nunca commite `.env.local` nem use `service_role` no frontend.

## 3. Deploy na Vercel

1. Importe o repositório em [vercel.com](https://vercel.com)
2. Framework: **Vite** (já configurado em `vercel.json`)
3. Build: `npm run build` → output `dist`
4. Adicione as variáveis acima em **Production**
5. Deploy

O app usa hash routing (`#escala`, …), então não é necessário rewrite especial para rotas.

### Preview deployments

Configure as mesmas variáveis em **Preview** apontando para o projeto Supabase de staging.

## 4. Supabase Auth (produção)

No dashboard → **Authentication → Providers → Email**:

| Configuração | Dev | Produção |
|--------------|-----|----------|
| Confirm email | Desligado | **Ligado** |
| Leaked password protection | Opcional | **Ligado** (Pro) |

Com confirmação ligada, novos usuários devem ficar com status `convite-pendente` até confirmarem o e-mail.

### URLs de redirect

Em **Authentication → URL Configuration**:

- **Site URL**: URL de produção (ex.: `https://roster-team.vercel.app`)
- **Redirect URLs**: inclua a URL local para dev (`http://localhost:5173`)

## 5. Supabase CLI (migrations)

Alternativa ao SQL Editor manual:

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npm run db:push
```

O `project-ref` está na URL do dashboard: `https://supabase.com/dashboard/project/<ref>`.

## 6. Segurança

- [ ] Security hardening migration rodada (`20250616000000_security_hardening.sql`)
- [ ] RLS ativo em todas as tabelas operacionais
- [ ] Security Advisor sem avisos críticos
- [ ] Leaked password protection ativado (se plano Pro)

## 7. Pós-deploy — validar

1. Login admin plataforma → `#empresas`
2. Login usuário empresa → menu filtrado por permissões
3. CRUD funcionário / turno / escala
4. Notificações recalculam após editar escala
5. Atividades registram login e alterações
6. Alterar senha em **Meu perfil**

## 8. Pendências futuras (não bloqueiam deploy)

- Upload de logo no Supabase Storage (hoje data URL no formulário)
- Editar nome em **Meu perfil** (RLS já permite update em `profiles`)
- Domínio customizado na Vercel
