# Roadmap — Roster Team

Documento de continuidade para retomar o desenvolvimento sem perder contexto.  
Última atualização: junho/2026.

---

## Visão do produto

Dois contextos distintos no mesmo app:

| Papel | O que vê | O que faz |
|-------|----------|-----------|
| **Admin da plataforma** (`is_platform_admin = true`) | Só menu **Empresas** | CRUD de empresas, recursos, usuários por empresa |
| **Usuário da empresa** (`empresa_id` preenchido) | Escala, turnos, equipe, etc. | Operação do dia a dia da cafeteria |

Roteamento por hash (`#escala`, `#empresas`, `#perfil`, `#configuracoes`, …).

---

## ✅ Concluído

### Infra e auth (Fases 1–2)

- [x] Projeto Supabase + `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- [x] Schema `empresas` + `profiles` + RLS base
- [x] Security hardening (`20250616000000_security_hardening.sql`)
- [x] Login real (`signInWithPassword`)
- [x] Sessão em `authSession` (cache + `onAuthStateChange` + `permissoes` na sessão)
- [x] Admin plataforma redirecionado para `#empresas`
- [x] Usuário sem `empresa_id` não entra (exceto admin)

### Empresas e usuários (Fase 3)

- [x] `empresasStorage` → Supabase (CRUD admin)
- [x] Aba **Usuários** no detalhe da empresa (`profilesStorage`) — admin plataforma
- [x] Página **Usuários** do menu (`#usuarios`) — admin da empresa (`usuarios.gerir`)
- [x] RPCs empresa: `empresa_vincular_usuario_empresa`, `empresa_remover_usuario`, `empresa_redefinir_senha_usuario`
- [x] Criar usuário (`signUp` auxiliar + RPC de vínculo)
- [x] Editar permissões (perfil + ajuste fino), status
- [x] Excluir usuário / limpar todos (RPCs admin)
- [x] Gerar nova senha provisória (ícone de chave + modal)
- [x] Fix RLS recursivo (`20250617100000_fix_profiles_admin_rls.sql`)
- [x] Último acesso no login (`ultimo_acesso` em `profiles`)
- [x] Menu **Empresas** oculto para usuários da empresa
- [x] Empresa no sidebar carregada por `sessao.empresaId`

### Perfis de acesso e permissões

- [x] Tabela `perfis_acesso` + seed automático (Visualizador, Editor, Gerente, Administrador)
- [x] Página **Configurações** (`#configuracoes`) — CRUD de perfis por empresa
- [x] Permissão `configuracoes.gerir` — menu e rota filtrados
- [x] Cadastro de usuário: campo **Permissões** (select de perfil) + ajuste fino
- [x] `perfil_acesso_id` em `profiles`
- [x] **Permissões nas rotas** — menu, URLs, sino de notificações e botões de edição (`src/utils/rotaPermissoes.ts`)

### Conta do usuário

- [x] Página **Meu perfil** (`#perfil`) — clique no nome na sidebar
- [x] Alterar senha (`signInWithPassword` + `updateUser`)
- [x] Layout refinado (cartão de identidade + painel de senha centralizado)

### UI / polish recente

- [x] Login sem texto “dados no Supabase” no rodapé
- [x] Senha provisória: mostrada uma vez no modal (não armazenada no banco)
- [x] Banner **demo** removido da página Usuários
- [x] **Funcionários** → Supabase (`funcionariosStorage`, migration #11, RLS `funcionarios.ver` / `funcionarios.editar`)
- [x] **Extras** → Supabase (`extrasStorage`, migration #12, RLS `extras.ver` / `extras.editar`)
- [x] **Turnos** → Supabase (`turnosStorage`, migration #13, RLS `turnos.ver` / `turnos.editar`)
- [x] Novo **usuário** cria `funcionario` vinculado (`profile_id`); cadastro só em Funcionários não cria login

---

## 🗄️ Migrations Supabase (ordem)

Rodar no **SQL Editor** se ainda não rodou:

| # | Arquivo | Obrigatório? | Notas |
|---|---------|--------------|-------|
| 1 | `20250615000000_initial_schema.sql` | Sim | Base |
| 2 | `20250616000000_security_hardening.sql` | Sim | Security Advisor |
| 3 | `20250617000000_empresa_usuarios.sql` | Sim | RPCs remover usuários |
| 4 | `20250617100000_fix_profiles_admin_rls.sql` | Sim | Fix erro 500 ao vincular usuário |
| 5 | `20250617200000_admin_redefinir_senha.sql` | Sim | Admin gera senha provisória |
| 6 | `20250617300000_profiles_ultimo_acesso.sql` | Sim | Coluna `ultimo_acesso` |
| 7 | `20250617400000_profiles_senha_provisoria.sql` | **Não** | Substituída pelo revert abaixo |
| 8 | `20250617500000_revert_senha_provisoria.sql` | Sim* | *Só se rodou a #7 |
| 9 | `20250618000000_perfis_acesso.sql` | Sim | Perfis de acesso + `configuracoes.gerir` |
| 10 | `20250618100000_empresa_gerir_usuarios.sql` | Sim | Admin da empresa gerencia usuários |
| 11 | `20250619000000_funcionarios.sql` | Sim | Equipe (funcionários) por empresa |
| 12 | `20250620000000_extras.sql` | Sim | Extras (cobertura pontual) por empresa |
| 13 | `20250621000000_turnos.sql` | Sim | Modelos de turno por empresa |
| 14 | `20250622000000_funcionarios_usuarios_opcionais.sql` | Sim | Usuários viram funcionários + campos opcionais |
| 15 | `20250623000000_vincular_usuario_cria_funcionario.sql` | Sim | Criar usuário já gera funcionário vinculado |
| 16 | `20250624000000_escala.sql` | Sim | Escala por dia (`escala_turnos`) + RLS |
| 17 | `20250625000000_atividades.sql` | Sim | Histórico de auditoria (`atividades`) + RLS |
| 18 | `20250626000000_notificacoes.sql` | Sim | Alertas da escala (`notificacoes`) + RLS |

Depois: criar admin no Auth → SQL `is_platform_admin = true` (ver `docs/SUPABASE.md`).

---

Legado removido na Fase 6. Único `localStorage` restante: empresa selecionada no painel do **admin da plataforma** (`empresasStorage`).

---

## 📋 Próximos passos

### Curto prazo (opcional)

- [ ] **Editar nome no Meu perfil** — usuário atualiza `profiles.nome` (RLS já permite)
- [ ] **Upload de logo** — bucket `empresa-logos` + URL assinada

### Fase 4 — Operação no Supabase (em andamento)

**Ordem acordada** (fluxo de uso da cafeteria):

```
Funcionários  →  Extras  →  Turnos  →  Escala
```

| # | Módulo | Por quê nesta ordem |
|---|--------|---------------------|
| **4.1** | ~~**Funcionários**~~ | ✅ Concluído |
| **4.2** | ~~**Extras**~~ | ✅ Concluído |
| **4.3** | ~~**Turnos**~~ | ✅ Concluído |
| **4.4** | ~~**Escala**~~ | ✅ Concluído |

Para cada módulo: **migration** → tipos → mapper → storage async → páginas existentes + **RLS** (`empresa_id` + permissões `.ver` / `.editar`).

**Fase 4 concluída.** Próximo: **Fase 5** (notificações).

### Fase 5 — Complementos (em andamento)

| # | Módulo | Status |
|---|--------|--------|
| **5.1** | ~~**Atividades**~~ | ✅ Concluído |
| **5.2** | ~~**Notificações**~~ | ✅ Concluído |

**Fase 5 concluída.** Próximo: **Fase 6** (produção).

- **Upload de logo** — bucket `empresa-logos` + URL assinada no `EmpresaForm`

---

## ✅ Fase 6 — Produção

- [x] Remover `usuariosStorage` (mock morto)
- [x] Remover seeds de demo em Atividades (`gerarExemplos`)
- [x] Seeds de funcionários mantidos só em `import.meta.env.DEV`
- [x] RLS por permissão nos módulos operacionais (já nas migrations #11–#18)
- [x] `README.md`, `docs/DEPLOY.md` e `docs/SUPABASE.md` atualizados
- [x] `vercel.json` + scripts `db:push` / `db:diff`
- [ ] Confirmação de e-mail no Auth — **manual no dashboard** (ver [DEPLOY.md](DEPLOY.md))
- [ ] Leaked password protection — **manual no dashboard** (Supabase Pro)
- [ ] Deploy na Vercel + variáveis de ambiente — **ação sua** (ver [DEPLOY.md](DEPLOY.md))
- [ ] Upload de logo no Storage — pendência futura

---

## 🧪 Como testar

### Admin plataforma (Jonathan)

1. Login → só vê **Empresas**
2. Abrir empresa → Detalhes / Funcionalidades / **Usuários**
3. Criar usuário → copiar senha do modal

### Admin da empresa (ex.: perfil Administrador)

1. Login → **Usuários**, **Configurações** (perfis de acesso)
2. Criar/editar usuários com perfil + ajuste fino de permissões
3. Visualizador: só vê Escala (sem editar) — validar menu filtrado

### Usuário da empresa (ex.: Isabela)

1. Login com senha provisória ou pessoal
2. Sidebar conforme permissões do perfil
3. **Meu perfil** → alterar senha

### Comandos locais

```bash
npm install
npm run dev    # http://localhost:5173
npm run build  # verificar TypeScript
```

---

## 📁 Arquivos-chave (referência rápida)

| Área | Arquivos |
|------|----------|
| Auth / sessão | `src/services/authSession.ts` |
| Permissões / rotas | `src/utils/rotaPermissoes.ts`, `src/utils/permissoes.ts` |
| Perfis de acesso | `src/services/perfisAcessoStorage.ts`, `src/pages/ConfiguracoesPage.tsx` |
| Funcionários | `src/services/funcionariosStorage.ts`, `src/pages/FuncionariosPage.tsx` |
| Extras | `src/services/extrasStorage.ts`, `src/pages/ExtrasPage.tsx` |
| Turnos | `src/services/turnosStorage.ts`, `src/pages/TurnosPage.tsx` |
| Escala | `src/services/escalaStorage.ts`, `src/pages/EscalaPage.tsx` |
| Atividades | `src/services/atividadesStorage.ts`, `src/pages/AtividadesPage.tsx` |
| Notificações | `src/services/notificacoesStorage.ts`, `src/services/notificacoesEngine.ts` |
| Usuários empresa | `src/services/profilesStorage.ts`, `src/pages/UsuariosPage.tsx` |
| Empresas (plataforma) | `src/services/empresasStorage.ts`, `src/pages/EmpresasPage.tsx` |
| Perfil conta | `src/pages/PerfilContaPage.tsx` |
| Menu / rotas | `src/components/layout/Sidebar.tsx`, `src/App.tsx`, `src/hooks/useHashRoute.ts` |
| SQL | `supabase/migrations/` |
| Setup Supabase | `docs/SUPABASE.md` |

---

## 💡 Decisões de produto já tomadas

- Senha provisória: **mostrada uma vez** no modal; não salvar em texto no banco
- Usuário troca senha definitiva em **Meu perfil**
- **Perfis de acesso** personalizáveis por empresa; usuário herda perfil + pode ter ajuste fino
- Campo **Permissões** no cadastro = select do perfil (não mais “papel” fixo)
- Fase 4: **Funcionários → Extras → Turnos → Escala** (não Turnos primeiro)
- `empresas` não é recurso toggleável por empresa — só admin da plataforma vê
- Platform admin ≠ usuário da empresa (perfis separados)

---

## Pausa / retomada

Ao voltar:

1. Confirmar `.env.local` e `npm run dev`
2. Migrations 1–18 rodadas no Supabase?
3. Deploy: seguir [docs/DEPLOY.md](DEPLOY.md)
4. Pendências opcionais: logo no Storage, editar nome no perfil

Estado atual: app 100% Supabase nos módulos de negócio. Pronto para deploy; seeds de dev só em `npm run dev`.
