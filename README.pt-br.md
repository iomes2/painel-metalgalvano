<div align="center">

Português (BR) | **[English](./README.markdown)** 🌐

# 🏗️ Painel Metalgalvano

### Painel de Gerenciamento de Obras — Trabalho de Conclusão de Curso (TCC)

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Storage-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)

**Aplicação web full-stack para digitalizar e centralizar a gestão documental de obras — com controle de acesso por perfil, formulários dinâmicos, upload de fotos, geração automática de PDFs, timeline de atividades e painel analítico.**

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

O **Painel Metalgalvano** é um sistema empresarial web desenvolvido como **Trabalho de Conclusão de Curso (TCC)** em Engenharia de Software no Centro Universitário Católica de Santa Catarina — Joinville.

A plataforma substitui os processos manuais e descentralizados de gerenciamento de documentos de obras da **Metalgalvano** (empresa do setor de galvanização em Araquari/Joinville) por um painel web moderno e centralizado.

### O Problema

| Antes (manual) | Depois (Painel Metalgalvano) |
|---|---|
| 📄 Documentos em papel e e-mails perdidos | ☁️ Tudo centralizado na nuvem |
| 🔍 Difícil localizar documentos por obra | 🔎 Filtros avançados e busca por texto |
| 📸 Fotos espalhadas no WhatsApp | 📁 Upload organizado por formulário |
| 📊 Relatórios preenchidos à mão | 📑 PDFs gerados e baixados automaticamente |
| 👥 Sem controle de acessos | 🔐 Controle de acesso por perfil (Admin / Gerente / Editor / Visualizador) |

---

## ✨ Funcionalidades

- 🔐 **Autenticação segura** — Login com e-mail/senha via Firebase Auth, recuperação de senha, controle de sessão e logout seguro
- 📝 **Formulários dinâmicos** — 6+ modelos de documentos customizáveis (Cronograma, Diário de Obra, Checklists, Medições, Relatório Fotográfico, Inspeção) com visibilidade condicional de campos e preenchimento automático por formulários vinculados
- 📸 **Upload de fotos** — Envio de imagens por campo do formulário via Firebase Storage, galeria e exclusão
- 📑 **Geração de PDFs** — Relatórios profissionais gerados automaticamente via PDFMake e disponíveis para download
- 📊 **Dashboard analítico** — Estatísticas em tempo real por ordem de serviço (formulários enviados, fotos, relatórios vinculados)
- 📅 **Timeline de atividades** — Histórico cronológico de envios e atualizações por ordem de serviço
- 🔍 **Busca avançada** — Filtro por número de OS, tipo de formulário, período e status
- 📂 **Biblioteca de documentos** — Repositório central de documentos da empresa (PDFs, imagens, planilhas)
- 📥 **Exportação para Excel** — Download de dados tabulares para análise offline
- 🔔 **Notificações** — Alertas internos para aprovações, atualizações e eventos relevantes
- 🛡️ **Logs de auditoria** — Histórico detalhado de ações armazenado por 90 dias (ação, entidade, IP, user agent)
- 🔗 **Formulários vinculados** — Após submeter um documento, o sistema sugere e navega automaticamente para o próximo formulário do fluxo da obra

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
| **TanStack Query** | Fetching, cache e sincronização de dados |
| **React Hook Form + Zod** | Formulários com validação em tempo real |
| **Recharts** | Gráficos e visualização de dados |
| **Lucide React** | Biblioteca de ícones |

### Backend
| Tecnologia | Uso |
|---|---|
| **Node.js 18+** | Runtime JavaScript |
| **Express.js 4** | Framework HTTP |
| **TypeScript 5** | Tipagem estática |
| **Prisma ORM 5** | Acesso type-safe ao banco |
| **PostgreSQL 15** | Banco de dados relacional principal |
| **Firebase Admin SDK** | Verificação de tokens de autenticação |
| **Firebase Storage** | Armazenamento de fotos e arquivos |
| **Google Cloud Firestore** | Sincronização em tempo real das ordens de serviço |
| **PDFMake** | Geração de relatórios em PDF |
| **ExcelJS** | Exportação de planilhas |
| **Winston** | Logging estruturado |
| **Zod** | Validação de schemas de requisição |
| **Helmet + CORS + Rate Limiting** | Segurança HTTP |

### DevOps & Qualidade
| Tecnologia | Uso |
|---|---|
| **Docker + Docker Compose** | Ambiente de desenvolvimento local |
| **GitHub Actions** | CI/CD (build, testes, deploy no GCP) |
| **GCP Cloud Run** | Hospedagem do backend |
| **Netlify** | Hospedagem do frontend |
| **SonarCloud** | Análise estática de código e quality gate |
| **Jest + React Testing Library** | Testes unitários e de integração |

---

## 🏛 Arquitetura

O sistema segue uma arquitetura **cliente-servidor** com estratégia híbrida de banco de dados: PostgreSQL (via Prisma) para dados relacionais estruturados e Firebase (Auth + Storage + Firestore) para autenticação, armazenamento de arquivos e sincronização em tempo real das ordens de serviço.

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Browser)                        │
│                                                                  │
│   Next.js 15 (SSR/App Router)  ◄──►  TanStack Query             │
│   Tailwind CSS + Shadcn/UI           React Hook Form             │
└────────────────────────────────┬─────────────────────────────────┘
                                 │ HTTPS
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                      API REST (Express.js)                       │
│                                                                  │
│   Controllers ──► Services ──► Prisma ORM ──► PostgreSQL 15     │
│        │                                                         │
│        ├── Firebase Admin SDK (verificação de token)             │
│        ├── PDFMake (geração de PDF)                              │
│        ├── ExcelJS (exportação Excel)                            │
│        └── Winston (logging estruturado)                         │
└──────────────────────────────────────────────────────────────────┘
                         │                  │
              ┌──────────┘                  └──────────┐
              ▼                                        ▼
   ┌──────────────────┐                   ┌────────────────────┐
   │   PostgreSQL 15  │                   │  Firebase Platform  │
   │   (Prisma ORM)   │                   │  Auth + Storage +   │
   │  Forms, Photos,  │                   │     Firestore       │
   │  Users, Logs...  │                   └────────────────────┘
   └──────────────────┘
```

### Modelo de Dados

```
User ──┬── Form ──── Photo
       │       └─── LinkedReport
       ├── AuditLog
       └── Notification
```

---

## 🚀 Primeiros Passos

### Pré-requisitos

- **Node.js** ≥ 18.0.0
- **npm** ≥ 9.0.0
- **PostgreSQL** 15 (ou Docker)
- Projeto **Firebase** configurado (Auth + Storage + Firestore)

### 1. Clonar o repositório

```bash
git clone https://github.com/iomes2/painel-metalgalvano.git
cd painel-metalgalvano
```

### 2. Configurar o Backend

```bash
cd backend
npm install
cp .env.example .env   # preencha com suas credenciais
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
| `CORS_ORIGIN` | URL do frontend (ex: `http://localhost:3000`) |
| `JWT_SECRET` | Segredo para tokens JWT |

</details>

```bash
npx prisma migrate dev
npx prisma generate
npm run dev          # Inicia em http://localhost:3001
```

### 3. Configurar o Frontend

```bash
cd ../frontend
npm install
cp .env.example .env.local   # preencha com suas credenciais
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

```bash
cd backend
docker compose up -d    # PostgreSQL + Backend + Prisma Studio
```

O **Prisma Studio** fica disponível em `http://localhost:5555` para explorar o banco visualmente.

---

## 🔌 API Endpoints

Todas as rotas exigem um Firebase ID Token via header `Authorization: Bearer <token>`.

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/v1/forms` | Enviar um formulário |
| `GET` | `/api/v1/forms` | Listar formulários (com filtros) |
| `GET` | `/api/v1/forms/:id` | Detalhes de um formulário |
| `PUT` | `/api/v1/forms/:id` | Atualizar formulário |
| `DELETE` | `/api/v1/forms/:id` | Excluir formulário |
| `POST` | `/api/v1/forms/:id/photos` | Upload de fotos para um formulário |
| `DELETE` | `/api/v1/photos/:id` | Excluir uma foto |
| `GET` | `/api/v1/forms/:id/pdf` | Gerar e baixar PDF |
| `GET` | `/api/v1/stats` | Estatísticas do dashboard |
| `GET` | `/api/v1/timeline` | Timeline de atividades |
| `GET` | `/api/v1/ordens-servico` | Listar ordens de serviço |
| `GET` | `/api/v1/notifications` | Listar notificações |
| `PATCH` | `/api/v1/notifications/:id/read` | Marcar notificação como lida |
| `GET` | `/api/v1/export` | Exportar dados em Excel |

---

## 📂 Estrutura do Projeto

```
painel-metalgalvano/
├── frontend/                    # Next.js 15 (App Router)
│   ├── src/
│   │   ├── app/                 # Rotas: /login, /dashboard, /admin
│   │   │   ├── dashboard/       # App principal: forms, search, timeline, docs, monitoramento
│   │   │   └── admin/           # Form builder (somente admin)
│   │   ├── components/
│   │   │   ├── auth/            # Guard e inicializador Firebase Auth
│   │   │   ├── dashboard/       # Cards de stats, painel de monitoramento
│   │   │   ├── forms/           # Renderizador dinâmico de formulários
│   │   │   ├── layout/          # Sidebar, header, navegação do usuário
│   │   │   ├── reports/         # Preview de PDF e visualizador de relatórios
│   │   │   ├── search/          # UI de busca e filtros
│   │   │   ├── timeline/        # Componente de timeline de atividades
│   │   │   └── ui/              # Primitivos Shadcn/UI
│   │   ├── config/
│   │   │   └── forms.ts         # Definições de todos os formulários (campos, tipos, gatilhos vinculados)
│   │   ├── hooks/               # Custom hooks (useAuth, useSessionExpiration, etc.)
│   │   └── lib/                 # API client, configuração Firebase, utilitários
│   └── public/
│
├── backend/                     # API REST Express.js
│   ├── src/
│   │   ├── controllers/         # formsController, photosController, statsController...
│   │   ├── services/            # formService, pdfService, exportService, backupService...
│   │   ├── middleware/          # Auth Firebase, error handler, rate limiter
│   │   ├── routes/              # Definição de rotas de todos os recursos
│   │   ├── validators/          # Schemas Zod para validação de requisições
│   │   └── utils/               # Logger, helpers
│   ├── prisma/
│   │   ├── schema.prisma        # Modelo de dados: User, Form, Photo, LinkedReport, AuditLog...
│   │   ├── migrations/          # Histórico de migrações
│   │   └── seed.ts              # Dados iniciais
│   └── docker-compose.yml
│
├── docs/                        # Documentação técnica
│   ├── ARCHITECTURE_C4.md
│   ├── FUNCTIONAL_REQUIREMENTS.md
│   ├── USER_STORIES.md
│   └── deployment_guide.md
│
└── .github/workflows/           # CI/CD: test → build → deploy no GCP Cloud Run
```

---

## 🔒 Segurança

| Camada | Implementação |
|---|---|
| **Autenticação** | Firebase Auth — e-mail/senha, recuperação de senha |
| **Autorização** | RBAC validado no servidor (Admin / Gerente / Editor / Visualizador) |
| **Segurança da API** | Helmet, allowlist CORS, Rate Limiter Express |
| **Integridade de dados** | Prisma (previne SQL injection), validação Zod em todas as rotas |
| **Armazenamento** | URLs temporárias assinadas do Firebase Storage |
| **Auditoria** | Log de todas as ações (entidade, usuário, IP, timestamp) por 90 dias |
| **Conformidade** | Tratamento de dados em conformidade com a LGPD |

---

## 🧪 Testes

```bash
# Backend (Jest)
cd backend && npm test

# Frontend (Jest + React Testing Library)
cd frontend && npm test
```

A qualidade do código é validada via **SonarCloud** a cada push na `master`, com quality gate que bloqueia o build em issues críticos.

---

## 📚 Documentação

| Arquivo | Conteúdo |
|---|---|
| [`docs/ARCHITECTURE_C4.md`](./docs/ARCHITECTURE_C4.md) | Diagramas C4 de arquitetura |
| [`docs/FUNCTIONAL_REQUIREMENTS.md`](./docs/FUNCTIONAL_REQUIREMENTS.md) | Lista completa de requisitos funcionais |
| [`docs/USER_STORIES.md`](./docs/USER_STORIES.md) | Histórias de usuário |
| [`docs/deployment_guide.md`](./docs/deployment_guide.md) | Guia de deploy em produção |
| [`backend/README.md`](./backend/README.md) | Documentação específica do backend |

---

## 👨‍💻 Autor

**Renan Iomes**
Engenharia de Software — Centro Universitário Católica de Santa Catarina (Joinville)
Trabalho de Conclusão de Curso (TCC) — 2025

[![GitHub](https://img.shields.io/badge/GitHub-iomes2-181717?style=flat-square&logo=github)](https://github.com/iomes2)

---

## 📄 Licença

Todos os direitos reservados. Este projeto foi desenvolvido como Trabalho de Conclusão de Curso (TCC) e não está disponível para uso comercial por terceiros.

---

<div align="center">

Feito com ❤️ e ☕ em Joinville, SC — 2025

</div>
