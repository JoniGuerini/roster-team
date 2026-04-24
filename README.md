# Brisa Café — Gestão de Funcionários

Aplicação web para a cafeteria **Brisa** gerenciar a equipe e (futuramente) a escala de funcionários.

Esta é a **base inicial** do projeto, com:

- Cadastro de funcionários (formulário completo com validação)
- Edição de funcionários
- Exclusão de funcionários (com confirmação)
- Listagem em tabela com busca por nome ou função
- Identidade visual da Brisa (azul escuro + branco)

## Stack

- [Vite](https://vitejs.dev/) + [React 19](https://react.dev/) + TypeScript
- CSS puro/customizado (sem libs de UI), com variáveis e tokens da paleta da Brisa
- Persistência local via **LocalStorage** (substituível por backend futuramente)

## Como rodar

```bash
cd brisa-cafe
npm install
npm run dev
```

Acesse [http://localhost:5173](http://localhost:5173).

## Estrutura

```
src/
├─ components/
│  ├─ ui/                  # Componentes base reutilizáveis (Button, Input, Modal, etc.)
│  ├─ layout/              # Sidebar e elementos de layout
│  └─ funcionarios/        # Form, lista e modal de exclusão
├─ pages/
│  └─ FuncionariosPage.tsx # Página principal
├─ services/
│  └─ funcionariosStorage.ts # CRUD em cima do LocalStorage
├─ types/
│  └─ funcionario.ts       # Tipos e enums (locais, contratos, funções, status)
├─ utils/
│  └─ funcionarioLabels.ts # Helpers de formatação/labels
└─ styles/
   └─ theme.css            # Tokens da identidade visual
```

## Próximos passos sugeridos

- Página de **Escala** (calendário semanal/mensal por funcionário)
- Upload real e armazenamento de PDFs (S3/Storage)
- Backend real (Node/Express ou Supabase) e autenticação
- Permissões (admin x gerente x funcionário)
- Relatórios de horas trabalhadas
```
