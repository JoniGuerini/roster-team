# Psico Lume — Design System (guia de replicação)

Documento de referência para replicar o visual do **Psico Lume** em outro app: shell com sidebar escura, painel principal “flutuante” sobre o fundo, cards arredondados, agenda com status coloridos e formulários suaves.

> **Tema de referência:** `refugio` (padrão). Os tokens abaixo usam esse tema salvo indicação contrária.

---

## 1. Stack de referência

| Camada | Tecnologia |
|--------|------------|
| UI base | React 19 + TypeScript |
| Estilo | Tailwind CSS v4 (`@theme inline`) |
| Componentes | shadcn/ui (variante `radix-ui`) |
| Ícones | Lucide React |
| Fontes | **Manrope Variable** (corpo) + **Fraunces Variable** (títulos) |
| Motion | Motion (`motion/react`) — fade login ↔ app |
| Sidebar | shadcn Sidebar (`variant="inset"`, `collapsible="icon"`) |

**Arquivos-fonte no repo:**

- `src/styles/lume-tokens.css` — tokens CSS por tema
- `src/lib/design-system.ts` — classes e primitivos para React
- `src/index.css` — fontes, radius scale, mapeamento Tailwind
- `src/components/ui/*` — primitivos (Card, Button, Sidebar, etc.)
- `src/App.tsx` — composição do shell autenticado

---

## 2. Filosofia visual

1. **Fundo escuro contínuo** (`bg-sidebar`) ocupa o viewport inteiro.
2. **Painel principal claro** (`bg-background`) é um card inset com `rounded-2xl`, `shadow-sm` e margem — parece “flutuar” sobre a sidebar.
3. **Cards internos** são brancos (`bg-card`), muito arredondados (`rounded-4xl`), com `shadow-md` e anel sutil.
4. **Cantos generosos** em quase tudo: botões `rounded-4xl`, inputs `rounded-3xl`, chips `rounded-full`.
5. **Tipografia dual:** Fraunces em títulos/números; Manrope no restante.
6. **Cor de destaque** (`accent-brand`, terracota no Refúgio) para logo, item ativo da sidebar e alertas.
7. **Hover suave** com `bg-accent` (tom azul no Refúgio) em selects e linhas de tabela.

---

## 3. Tipografia

```css
--font-sans: 'Manrope Variable', sans-serif;
--font-heading: 'Fraunces Variable', serif;
```

| Uso | Classe / regra |
|-----|----------------|
| Corpo | `font-sans` (default no `html`) |
| Títulos `h1–h6` | `font-family: var(--font-heading)` via CSS base |
| Título de página (header) | `text-base font-medium` |
| Título de seção / card | `font-heading text-base font-semibold` ou `text-lg font-semibold` |
| Labels de formulário | `text-xs` + `text-muted-foreground` opcional |
| Números em destaque (agenda lateral) | `font-heading text-3xl font-semibold tracking-tight` |

**Pacotes npm:** `@fontsource-variable/manrope`, `@fontsource-variable/fraunces`

---

## 4. Raio, sombra e densidade

### Radius scale (base `--radius: 0.625rem` = 10px)

| Token Tailwind | Fórmula | ~px |
|----------------|---------|-----|
| `rounded-lg` | `--radius-lg` | 10 |
| `rounded-xl` | `--radius-xl` | 14 |
| `rounded-2xl` | `--radius-2xl` | 18 |
| `rounded-3xl` | `--radius-3xl` | 22 |
| `rounded-4xl` | `--radius-4xl` | 26 |

### Sombras típicas

| Elemento | Classes |
|----------|---------|
| Main inset | `shadow-sm` |
| Card padrão | `shadow-md ring-1 ring-foreground/5` |
| Botão outline no header | `shadow-sm` |
| Evento na agenda (hover) | `hover:shadow-md` |

### Densidade de página

```css
--density-page-gap: 1rem;           /* gap entre blocos na main */
--density-table-cell-py: 0.375rem;  /* células de tabela */
```

Padding da área de conteúdo: `p-4 gap-[var(--density-page-gap)]`.

---

## 5. Arquitetura do shell (o efeito “card sobre fundo”)

### Árvore DOM (app autenticado)

```
fixed inset-0 bg-sidebar                    ← fundo escuro full viewport
  LumeNavyGlow (fixed, z-0)               ← orbes decorativos
  SidebarProvider (bg-transparent, h-svh)
    flex h-svh
      AppSidebar (variant=inset)            ← navegação
      main[data-slot=sidebar-inset]         ← painel principal (LUME_MAIN_SURFACE_CLASS)
        header (h-16, border-b)            ← barra superior
        main (flex-1, p-4, scroll)        ← conteúdo da página
```

### Classe do painel principal (`LUME_MAIN_SURFACE_CLASS`)

```
relative flex min-h-0 min-w-0 flex-1 flex-col self-stretch overflow-hidden
rounded-2xl bg-background shadow-sm m-2 ml-0
```

### Glow de fundo (`LumeNavyGlow`)

Dois círculos com blur sobre o fundo sidebar:

```html
<div class="absolute -top-24 -right-24 size-80 rounded-full bg-sidebar-primary/20 blur-3xl" />
<div class="absolute -bottom-28 -left-20 size-80 rounded-full bg-sidebar-primary/10 blur-3xl" />
```

No app logado, o glow fica no `fixed inset-0` **fora** do `SidebarProvider` (`showGlow={false}` no provider) para evitar costura entre sidebar e inset.

### Header da main

```
h-16 shrink-0 flex items-center gap-2 border-b px-4
```

- Esquerda: `SidebarTrigger` + `Separator` vertical + título da página
- Direita: botões `outline` `rounded-full` `bg-card shadow-sm hover:bg-accent/50`

---

## 6. Tokens de cor — tema Refúgio (padrão)

Aplicar em `<html data-theme="refugio">` ou sem `data-theme` (fallback em `:root:not([data-theme])`).

### Semânticos principais

| Token CSS | Hex / valor | Uso |
|-----------|-------------|-----|
| `--background` | `#E8EDF2` | Fundo do painel main |
| `--foreground` | `#2A3544` | Texto principal |
| `--card` | `#FFFFFF` | Cards, inputs preenchidos |
| `--primary` | `#3D5166` | Botões primários, dia “hoje” |
| `--primary-foreground` | `#F5F7FA` | Texto em botão primário |
| `--muted` | `#D5DDE6` | Fundos muted |
| `--muted-foreground` | `#5A6578` | Texto secundário |
| `--accent` | `#CDDAEA` | Hover de selects / linhas |
| `--accent-brand` | `#C97B63` | Terracota — logo, item ativo sidebar |
| `--attention` | `#C97B63` | Alertas, inadimplência |
| `--border` | `#3D516624` | Bordas (14% alpha) |
| `--ring` | `#3D5166` | Focus ring |

### Sidebar

| Token | Valor |
|-------|-------|
| `--sidebar` | `#2D3A4A` |
| `--sidebar-foreground` | `#F5F7FA` |
| `--sidebar-primary` | terracota (`--accent-brand`) |
| `--sidebar-primary-foreground` | `#FFFAF7` |
| `--sidebar-accent` | `#FFFFFF14` |
| `--sidebar-accent-foreground` | `#F5F7FA` |
| `--sidebar-border` | `#FFFFFF1A` |

### Superfícies extras

| Token | Uso |
|-------|-----|
| `--surface-dialog` | `#F4F6F9` — modais |
| `--surface-navy` | `#2D3A4A` — hero navy (perfil paciente) |
| `--surface-navy-heading` | `#F5F7FA` — título sobre navy |

### Mapeamento Tailwind

Usar classes semânticas, nunca hex inline em componentes:

`bg-background`, `bg-card`, `bg-sidebar`, `text-muted-foreground`, `border-border`, `bg-accent`, `text-attention`, `bg-surface-dialog`, etc.

---

## 7. Sidebar

### Configuração

```tsx
<Sidebar variant="inset" collapsible="icon">
```

| Constante | Valor |
|-----------|-------|
| Largura expandida | `16rem` (`--sidebar-width`) |
| Largura colapsada (ícone) | `3rem` (`--sidebar-width-icon`) |
| Atalho teclado | `Ctrl/Cmd + B` |

### Variante `inset`

- Wrapper: `has-data-[variant=inset]:bg-sidebar`
- Container da sidebar: `bg-transparent p-2` (padding cria respiro)
- Inner: `bg-transparent` — o fundo escuro vem do wrapper/viewport
- Main inset: `m-2 ml-0 rounded-2xl` — encaixa à direita da sidebar

### Item de menu (`SidebarMenuButton`)

| Estado | Estilo |
|--------|--------|
| Default | `rounded-xl px-3 py-2 h-9 text-sm` |
| Hover | `bg-sidebar-accent text-sidebar-accent-foreground` |
| **Ativo** | `bg-sidebar-primary text-sidebar-primary-foreground font-medium` |
| Colapsado | `size-8`, texto oculto, só ícone |

### Grupos de navegação

- Label: `text-xs font-medium text-sidebar-foreground/70 px-3 h-8`
- Grupos: Geral · Atendimento · Financeiro · Gestão
- Gap entre itens: `gap-1`

### Logo / marca (header)

- Ícone SVG com `fill="var(--theme-logo-mark)"` (terracota no Refúgio)
- Texto: `font-heading text-lg font-semibold`
- Altura do botão logo: `h-14`

### Footer

- `NavUser` com avatar, menu conta/sair
- Mesma paleta sidebar (`text-sidebar-foreground`)

### Mobile

- Sidebar vira `Sheet` com `bg-sidebar` + `LumeNavyGlow` interno

---

## 8. Cards e painéis de conteúdo

### Card padrão (`Card`)

```
rounded-4xl bg-card py-6 text-sm shadow-md ring-1 ring-foreground/5
[--card-spacing: 1.5rem]
```

Variante compacta: `data-size="sm"` → spacing `1rem`.

### Padrões de uso

| Contexto | Classes extras |
|----------|----------------|
| Toolbar de página | `flex flex-row flex-wrap items-center gap-3 p-3` |
| Card sem padding interno (agenda) | `p-0 gap-0 overflow-hidden` |
| Seção em formulário | `rounded-2xl border border-border bg-card p-4 shadow-sm` |
| Hero perfil paciente | `rounded-3xl bg-sidebar p-6 text-sidebar-foreground` |
| Empty state | `border border-dashed border-border bg-background/40 p-10` |

### Painel navy (hero)

Usado no topo do perfil do paciente:

```
rounded-3xl bg-sidebar p-6 text-sidebar-foreground
```

- Título: `font-heading text-2xl font-semibold text-surface-navy-heading`
- Meta: `text-sidebar-foreground/70`
- Badges sobre navy: `border-white/15 bg-white/10 text-sidebar-foreground`

---

## 9. Botões, tabs e controles

### Button

- Forma: `rounded-4xl`
- Primário: `bg-primary text-primary-foreground hover:bg-primary/80`
- Outline: `border-border bg-background hover:bg-muted`
- Ghost: `hover:bg-muted`
- Tamanhos: `h-9` (default), `h-8` (sm), `size-8` (icon-sm)

### Tabs (ex.: Mês / Semana / Dia na agenda)

```tsx
<TabsList className="border border-border bg-background/40">
  <TabsTrigger value="...">...</TabsTrigger>
</TabsList>
```

- Lista: `rounded-full p-1`
- Trigger ativo: `bg-card shadow-sm text-foreground`

### Pill de navegação (agenda: ◀ ▶ Hoje)

```
inline-flex h-9 items-center gap-1 rounded-full border border-border bg-background/40 p-1
```

Botões internos: `size-7 rounded-full hover:bg-accent/50`

### Badge

- Outline padrão: `variant="outline" border-border bg-background/40`
- Alerta: `border-attention/30 bg-attention/10 text-attention`

---

## 10. Formulários

### Input / Select / DatePicker trigger

```
form-field h-9 rounded-3xl border bg-card px-3 text-sm
```

| Estado | Borda |
|--------|-------|
| Vazio | `border border-foreground/22 hover:border-foreground/35` |
| Preenchido | `border-2 border-foreground/55` |
| Placeholder | `text-muted-foreground/60` |
| Focus | `ring-3 ring-ring/30 border-ring` |

### Select dropdown item

```
rounded-2xl py-2 px-3 text-sm font-medium
focus:bg-accent focus:text-accent-foreground
```

### Modal / Dialog

```
rounded-4xl bg-surface-dialog (ou bg-popover)
max-h-[92vh] flex flex-col overflow-hidden
```

- Header: `shrink-0 border-b px-6 py-4`
- Corpo rolável: `ScrollArea` com `flex-1 min-h-0`
- Footer: `shrink-0 border-t px-4 py-3`

---

## 11. Agenda — layout e visual

### Estrutura da página (`CalendarPage`)

```
flex min-h-0 flex-1 flex-col gap-4
├── Card toolbar (navegação, título, legenda, tabs, nova sessão)
└── flex min-h-0 flex-1 gap-4
    ├── Card calendário (flex-1, p-0)
    └── Card lateral direita (max-w-xs, lista do dia)
```

Página usa `overflow-hidden` no shell (fill viewport) — scroll só dentro dos cards.

### Constantes do grid horário (semana/dia)

| Constante | Valor |
|-----------|-------|
| `HOUR_HEIGHT` | `56px` |
| `PX_PER_MIN` | `56/60` |
| Scroll inicial | `7 * HOUR_HEIGHT` (começa ~7h) |
| Snap ao arrastar | 15 minutos |
| Altura mínima do bloco | `22px` |

### Vista mês

- Grid: `grid-cols-7 grid-rows-6 gap-1`
- Célula do dia: `rounded-xl border border-border p-1.5`
- Dia selecionado ou hoje: `border-primary bg-accent`
- Hover: `hover:bg-accent/50`
- Fora do mês: `bg-background/40 text-muted-foreground`
- Número do dia: círculo `size-7 rounded-full font-heading text-sm`
- Hoje: `bg-primary text-primary-foreground font-semibold`
- Contador de sessões: `rounded-lg border bg-background/40 px-2 py-1` + `font-heading text-sm font-semibold`

### Vista semana / dia (TimeGrid)

- Coluna de horas: `w-16`, labels `text-[11px] text-muted-foreground`
- Linhas horizontais: `border-b border-border/60`
- Separadores verticais: `border-l`
- **Bloco de evento:**
  ```
  absolute rounded-lg border px-2 py-1 shadow-sm
  + sessionStatusConfig[status].block
  hover:shadow-md
  dragging: ring-2 ring-primary opacity-90
  ```
- Título: `text-xs font-medium truncate`
- Horário: `text-[11px]` + cor muted do status
- Faltou/Cancelada: `line-through` no título

### Painel lateral do dia

- Data grande: `font-heading text-3xl font-semibold`
- Mês: `text-sm text-muted-foreground`
- Badge contagem: `outline bg-background/40`
- Lista: `CalendarEventListItem` com `rounded-2xl border p-3 shadow-sm`

### `CalendarEventListItem` (lista lateral)

```
rounded-2xl border p-3 shadow-sm hover:shadow-md
+ cores do status (sessionStatusConfig.block)
```

Inclui ícone de relógio, modalidade (MapPin/Video), hint “clique para editar”.

---

## 12. Cores de status de sessão

Tokens globais em `:root` (não mudam por tema):

| Status | BG | Border | Texto |
|--------|-----|--------|-------|
| Agendada | `#F8F6F0` | `#E5E0D5` | `#1C3351` |
| Realizada | `#EAF5EF` | `#8FB9A0` | `#184032` |
| Faltou | `#FEE2E2` | `#F87171` | `#991B1B` |
| Remarcada | `#E8EEF5` | `#7BA3D4` | `#1E3A5F` |
| Cancelada | `#F3F4F6` | `#D1D5DB` | `#6B7280` |

Classes Tailwind (exemplo):

```
border-[var(--session-realizada-border)]
bg-[var(--session-realizada-bg)]
text-[var(--session-realizada-fg)]
```

Legenda inline no toolbar: componente `SessionStatusLegend`.

---

## 13. Outros temas (opcional)

O app suporta 5 temas via `data-theme` no `<html>`:

| ID | Sidebar | Background | Accent |
|----|---------|------------|--------|
| `refugio` | `#2D3A4A` | `#E8EDF2` | terracota |
| `lume` | `#1B3A5C` | `#EFE7D5` | menta |
| `forja` | `#2A2928` | `#383736` | âmbar |
| `horizonte` | `#1E3D4D` | `#F0EBE3` | apricot |
| `entardecer` | `#0E0D0C` | `#161514` | coral |

Para replicar só o look “clínica suave”, use **Refúgio**.

---

## 14. Motion e transições

| Momento | Config |
|---------|--------|
| Login ↔ App | `opacity 0→1`, `duration: 0.28`, `ease: [0.4, 0, 0.2, 1]` |
| Sidebar collapse | `transition-[width] duration-200 ease-linear` |
| Botão press | `active:translate-y-px` |

`MotionConfig reducedMotion="user"` no root.

---

## 15. Scrollbar

Scrollbar nativa **oculta** globalmente; usar `ScrollArea` (Radix) com thumb:

```css
--scrollbar-thumb: var(--refugio-slate-alpha-25);
--scrollbar-thumb-hover: var(--refugio-slate-alpha-44);
```

---

## 16. Checklist de replicação

### Fase 1 — Fundação
- [ ] Instalar Tailwind v4 + fontes Manrope e Fraunces
- [ ] Copiar/adaptar `lume-tokens.css` (pelo menos tema Refúgio)
- [ ] Mapear tokens em `@theme inline` (`index.css`)
- [ ] Definir `data-theme="refugio"` no HTML

### Fase 2 — Shell
- [ ] Viewport `fixed inset-0 bg-sidebar` + glow
- [ ] Sidebar shadcn `variant="inset" collapsible="icon"`
- [ ] Main com `rounded-2xl bg-background shadow-sm m-2 ml-0`
- [ ] Header `h-16 border-b` com trigger + título + ações

### Fase 3 — Componentes
- [ ] Card `rounded-4xl shadow-md ring-1`
- [ ] Button `rounded-4xl`
- [ ] Inputs `rounded-3xl` com estados vazio/preenchido
- [ ] Select item hover `bg-accent`

### Fase 4 — Agenda (se aplicável)
- [ ] Toolbar em Card com pills e tabs
- [ ] Grid mês 7×6 com células `rounded-xl`
- [ ] TimeGrid 56px/hora com blocos coloridos por status
- [ ] Painel lateral `max-w-xs` com event cards `rounded-2xl`
- [ ] Tokens `--session-*` para cores de status

### Fase 5 — Polimento
- [ ] Hero navy `bg-sidebar rounded-3xl` em perfis
- [ ] Modais `bg-surface-dialog` com scroll interno
- [ ] `ScrollArea` em listas longas
- [ ] Fade na troca de telas principais

---

## 17. Snippet mínimo do shell (React)

```tsx
<div className="fixed inset-0 isolate overflow-hidden bg-sidebar">
  <LumeNavyGlow fixed />
  <SidebarProvider showGlow={false} className="relative z-10 h-svh !bg-transparent">
    <div className="flex h-svh min-h-0 w-full overflow-hidden">
      <AppSidebar variant="inset" collapsible="icon" />
      <main
        data-slot="sidebar-inset"
        className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-background shadow-sm m-2 ml-0"
      >
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          {/* SidebarTrigger + título + ações */}
        </header>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          {/* Conteúdo */}
        </div>
      </main>
    </div>
  </SidebarProvider>
</div>
```

---

## 18. O que não precisa copiar 1:1

- Lógica de negócio (pacientes, sessões, pagamentos)
- Dados demo / `mockPatients`
- i18n pt/en (só o visual)
- Export XLSX e paleta `sheetPalette` (a menos que tenha planilhas)
- Temas extras além do Refúgio (opcional)

---

*Gerado a partir do Psico Lume v0.8.1 — commit de referência com modal de sessão e tema Refúgio.*
