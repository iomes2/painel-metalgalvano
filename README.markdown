<div align="center">

# 🏗️ Painel Metalgalvano

### Sistema Empresarial para Gerenciamento de Processos de Obras

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Storage-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)

**Aplicação web full-stack para digitalizar e centralizar a gestão documental de obras, incluindo formulários dinâmicos, upload de fotos, geração de PDFs, timeline de progresso e inteligência artificial.**

[Visão Geral](#-visão-geral) •
[Funcionalidades](#-funcionalidades) •
[Tech Stack](#-tech-stack) •
[Arquitetura](#-arquitetura) •
[Primeiros Passos](#-primeiros-passos) •
[API](#-api-endpoints) •
[Licença](#-licença)

</div>

---

## 📋 Visão Geral

O **Painel Metalgalvano** é um sistema empresarial desenvolvido como **Trabalho de Conclusão de Curso (TCC)** em Engenharia de Software no Centro Universitário Católica de Santa Catarina — Joinville.

A plataforma resolve a gestão manual e descentralizada de documentos de obras da **Metalgalvano** (setor de galvanização — Araquari/Joinville), substituindo planilhas e papéis por um painel web moderno e inteligente.

### O Problema

| Antes (manual) | Depois (Painel Metalgalvano) |
|---|---|
| 📄 Documentos em papel e e-mail | ☁️ Tudo centralizado na nuvem |
| 🔍 Busca difícil por obra/período | 🔎 Filtro e pesquisa avançada |
| 📸 Fotos perdidas no WhatsApp | 📁 Upload organizado por formulário |
| 📊 Relatórios feitos manualmente | 📑 PDFs gerados automaticamente |
| 👥 Sem controle de acessos | 🔐 Roles por organização (Owner/Admin/Member/Viewer) |

---

## ✨ Funcionalidades

### Core
- 🔐 **Autenticação segura** — Login com e-mail/senha via Firebase Auth, recuperação de senha e logout seguro
- 📝 **Formulários dinâmicos** — Criação e preenchimento de modelos customizáveis (Cronograma, Diário de Obra, Checklists, Medições, etc.) com Form Builder visual para administradores
- 📸 **Upload de fotos** — Envio de imagens por campo do formulário com armazenamento no Firebase Storage
- 📑 **Geração de PDFs** — Relatórios profissionais gerados automaticamente via PDFMake/Puppeteer
- 📊 **Dashboard analítico** — Painel com gráficos Recharts para monitoramento em tempo real das obras

### Avançado
- 🏢 **Multi-tenancy** — Suporte a múltiplas organizações com isolamento de dados (Stripe integration para subscriptions)
- 📅 **Timeline de obras** — Visualização cronológica do progresso de cada projeto
- 📥 **Exportação Excel** — Download de dados tabulares via ExcelJS
- 🔔 **Notificações** — Sistema de alertas para atualizações em documentos
- 🔍 **Busca avançada** — Filtro por obra, período, gerente e status do documento
- 🤖 **Inteligência Artificial** — Integração com Google Gemini (via Genkit) para otimização de processos
- 🛡️ **Auditoria** — Logs de ações detalhados por 90 dias (IP, user-agent, entidade)
- 🌐 **Internacionalização** — Interface com suporte multi-idioma

---

## 🛠 Tech Stack

### Frontend
| Tecnologia | Uso |
|---|---|
| **Next.js 15** (App Router + Turbopack) | Framework React com SSR |
| **React 18** | Biblioteca de UI |
| **TypeScript 5** | Tipagem estática |
| **Tailwind CSS 3** | Estilização utility-first |
| **Shadcn/UI** (Radix Primitives) | Componentes acessíveis |
| **TanStack Query** | Cache e sincronização de dados |
| **React Hook Form + Zod** | Formulários com validação |
| **Recharts** | Gráficos e visualização |
| **Genkit (Google AI)** | Integração com IA generativa |
| **Lucide React** | Ícones |

### Backend
| Tecnologia | Uso |
|---|---|
| **Node.js 18+** | Runtime JavaScript |
| **Express.js 4** | Framework HTTP |
| **TypeScript 5** | Tipagem estática |
| **Prisma ORM 5** | Acesso ao banco de dados |
| **PostgreSQL 15** | Banco de dados relacional |
| **Firebase Admin SDK** | Autenticação e Storage server-side |
| **PDFMake + Puppeteer** | Geração de relatórios PDF |
| **ExcelJS** | Exportação de planilhas |
| **Stripe** | Pagamentos e subscriptions |
| **Winston** | Logging estruturado |
| **Zod** | Validação de schemas |
| **Helmet + CORS + Rate Limit** | Segurança HTTP |

### DevOps & Qualidade
| Tecnologia | Uso |
|---|---|
| **Docker + Docker Compose** | Containerização |
| **GitHub Actions** | CI/CD para GCP |
| **SonarCloud** | Análise estática de código |
| **Jest + Testing Library** | Testes unitários e de integração |
| **Netlify** | Hosting do frontend |
| **Render / GCP Cloud Run** | Hosting do backend |

---

## 🏛 Arquitetura

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Browser)                        │
│                                                                  │
│   Next.js 15 (SSR)  ◄──►  TanStack Query  ◄──►  React 18 UI    │
│   Tailwind + Shadcn/UI         │                Recharts         │
└────────────────────────────────┼─────────────────────────────────┘
                                 │ HTTPS
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                      API REST (Express.js)                       │
│                                                                  │
│   Controllers ──► Services ──► Prisma ORM ──► PostgreSQL 15     │
│        │                                                         │
│        ├── Firebase Admin (Auth verification + Storage)          │
│        ├── PDFMake / Puppeteer (PDF generation)                  │
│        ├── ExcelJS (Excel export)                                │
│        ├── Stripe (Payments)                                     │
│        └── Winston (Structured logging)                          │
└──────────────────────────────────────────────────────────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          ▼                      ▼                      ▼
   ┌─────────────┐    ┌──────────────────┐    ┌────────────────┐
   │ PostgreSQL   │    │ Firebase Auth    │    │ Firebase       │
   │ (Prisma)     │    │ & Storage        │    │ Storage        │
   │              │    │                  │    │ (Fotos)        │
   └─────────────┘    └──────────────────┘    └────────────────┘
```

### Modelo de dados (principais entidades)

```
User ──┬── OrganizationMember ──── Organization
       │                              ├── Project
       │                              ├── FormTemplate
       │                              ├── Form ──── Photo
       │                              │         └── LinkedReport
       │                              ├── Document
       │                              └── Subscription (Stripe)
       ├── AuditLog
       └── Notification
```

---

## 🚀 Primeiros Passos

### Pré-requisitos

- **Node.js** ≥ 18.0.0
- **npm** ≥ 9.0.0
- **PostgreSQL** 15 (ou Docker)
- Projeto **Firebase** configurado (Auth + Storage)

### 1. Clonar o repositório

```bash
git clone https://github.com/iomes2/painel-metalgalvano.git
cd painel-metalgalvano
```

### 2. Configurar o Backend

```bash
cd backend
npm install
```

Copie o arquivo de variáveis de ambiente e preencha com suas credenciais:

```bash
cp .env.example .env
```

<details>
<summary>📄 Variáveis de ambiente do Backend</summary>

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Connection string do PostgreSQL |
| `FIREBASE_PROJECT_ID` | ID do projeto Firebase |
| `FIREBASE_PRIVATE_KEY` | Chave privada da service account |
| `FIREBASE_CLIENT_EMAIL` | E-mail da service account |
| `FIREBASE_STORAGE_BUCKET` | Bucket do Firebase Storage |
| `JWT_SECRET` | Segredo para tokens JWT |
| `CORS_ORIGIN` | URL do frontend (ex: `http://localhost:3000`) |

</details>

Execute as migrações do banco e inicie o servidor:

```bash
npx prisma migrate dev
npx prisma generate
npm run dev          # Inicia em http://localhost:3001
```

### 3. Configurar o Frontend

```bash
cd ../frontend
npm install
```

```bash
cp .env.example .env.local
```

<details>
<summary>📄 Variáveis de ambiente do Frontend</summary>

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | API key do Firebase |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID |
| `NEXT_PUBLIC_API_URL` | URL da API (ex: `http://localhost:3001`) |
| `NEXT_PUBLIC_USE_BACKEND` | `true` para usar a API real |

</details>

```bash
npm run dev          # Inicia em http://localhost:3000
```

### 4. Usando Docker (alternativa)

Se preferir subir tudo com Docker Compose:

```bash
cd backend
docker compose up -d    # PostgreSQL + Backend + Prisma Studio
```

O **Prisma Studio** fica disponível em `http://localhost:5555` para explorar o banco visualmente.

---

## 🔌 API Endpoints

A API REST segue o padrão `/api/v1` com autenticação via Firebase ID Token no header `Authorization: Bearer <token>`.

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/v1/forms` | Criar formulário |
| `GET` | `/api/v1/forms` | Listar formulários |
| `GET` | `/api/v1/forms/:id` | Detalhes de um formulário |
| `PUT` | `/api/v1/forms/:id` | Atualizar formulário |
| `POST` | `/api/v1/forms/:id/photos` | Upload de fotos |
| `GET` | `/api/v1/forms/:id/pdf` | Gerar/baixar PDF |
| `GET` | `/api/v1/documents` | Listar documentos |
| `GET` | `/api/v1/stats` | Estatísticas do dashboard |
| `GET` | `/api/v1/timeline` | Timeline de atividades |
| `GET` | `/api/v1/ordens-servico` | Ordens de serviço |
| `POST` | `/api/v1/form-templates` | Criar template de formulário |
| `GET` | `/api/v1/organizations` | Organizações do usuário |
| `GET` | `/api/v1/notifications` | Notificações |
| `GET` | `/api/v1/export` | Exportar dados (Excel) |

---

## 📂 Estrutura do Projeto

```
painel-metalgalvano/
├── frontend/                    # Next.js 15 (App Router)
│   ├── src/
│   │   ├── app/                 # Rotas (login, dashboard, admin, lobby)
│   │   ├── components/          # Componentes React organizados por domínio
│   │   │   ├── auth/            # Autenticação
│   │   │   ├── dashboard/       # Painel principal
│   │   │   ├── forms/           # Formulários dinâmicos
│   │   │   ├── layout/          # Navbar, Sidebar, Footer
│   │   │   ├── reports/         # Relatórios e PDFs
│   │   │   ├── search/          # Busca avançada
│   │   │   ├── timeline/        # Timeline de obras
│   │   │   └── ui/              # Shadcn/UI primitives
│   │   ├── ai/                  # Genkit (Google Gemini) flows
│   │   ├── contexts/            # React Contexts (Organization)
│   │   ├── hooks/               # Custom hooks
│   │   ├── lib/                 # Utilitários e configurações
│   │   └── types/               # TypeScript types
│   └── public/                  # Assets estáticos
│
├── backend/                     # Express.js + Prisma
│   ├── src/
│   │   ├── controllers/         # Handlers das rotas
│   │   ├── services/            # Lógica de negócio
│   │   ├── middleware/          # Auth, validation, rate-limit
│   │   ├── routes/              # Definição de rotas
│   │   ├── validators/          # Schemas de validação (Zod)
│   │   ├── utils/               # Helpers
│   │   └── tests/               # Testes unitários
│   ├── prisma/
│   │   ├── schema.prisma        # Modelo do banco de dados
│   │   ├── migrations/          # Histórico de migrações
│   │   └── seed.ts              # Dados iniciais
│   └── docker-compose.yml       # PostgreSQL + Backend + Prisma Studio
│
├── docs/                        # Documentação técnica
│   ├── ARCHITECTURE_C4.md       # Diagramas C4
│   ├── FUNCTIONAL_REQUIREMENTS.md
│   ├── USER_STORIES.md
│   ├── deployment_guide.md
│   └── GCP_SETUP_QUICKSTART.md
│
├── .github/workflows/           # CI/CD (GitHub Actions → GCP)
├── sonar-project.properties     # Configuração SonarCloud
└── netlify.toml                 # Deploy frontend (Netlify)
```

---

## 🔒 Segurança

| Camada | Implementação |
|---|---|
| **Autenticação** | Firebase Auth (e-mail/senha, recuperação, 2FA) |
| **Autorização** | RBAC por organização (Owner → Admin → Member → Viewer) |
| **API** | Helmet, CORS configurado, Rate Limiting |
| **Dados** | Prisma (prevenção SQL Injection), validação Zod |
| **Storage** | URLs temporárias com token no Firebase Storage |
| **Compliance** | Conformidade LGPD, logs de auditoria por 90 dias |

---

## 🧪 Testes

```bash
# Backend
cd backend
npm test                  # Jest
npm run test:watch        # Watch mode

# Frontend
cd frontend
npm test                  # Jest + React Testing Library
npm run test:watch        # Watch mode
```

---

## 📚 Documentação Complementar

| Documento | Conteúdo |
|---|---|
| [`docs/ARCHITECTURE_C4.md`](./docs/ARCHITECTURE_C4.md) | Diagramas C4 (Contexto, Contêineres, Componentes) |
| [`docs/FUNCTIONAL_REQUIREMENTS.md`](./docs/FUNCTIONAL_REQUIREMENTS.md) | Requisitos funcionais detalhados |
| [`docs/USER_STORIES.md`](./docs/USER_STORIES.md) | Histórias de usuário |
| [`docs/deployment_guide.md`](./docs/deployment_guide.md) | Guia de deploy |
| [`docs/GCP_SETUP_QUICKSTART.md`](./docs/GCP_SETUP_QUICKSTART.md) | Setup no Google Cloud |
| [`backend/README.md`](./backend/README.md) | Documentação específica do backend |

---

## 👨‍💻 Autor

**Renan Iomes**
Engenharia de Software — Centro Universitário Católica de Santa Catarina (Joinville)

[![GitHub](https://img.shields.io/badge/GitHub-iomes2-181717?style=flat-square&logo=github)](https://github.com/iomes2)

---

## 📄 Licença

Este projeto foi desenvolvido como Trabalho de Conclusão de Curso (TCC). Todos os direitos reservados.

---

<div align="center">

Feito com ❤️ e ☕ em Joinville, SC — 2025

</div>
