<div align="center">

🌐 **[Português (BR)](./README.pt-br.md)** | English

# 🏗️ Painel Metalgalvano

### Enterprise Construction Project Management System

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Storage-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)

**A full-stack web application to digitize and centralize construction site document management — featuring dynamic forms, photo uploads, automated PDF reports, project timelines, and AI-powered workflows.**

[Overview](#-overview) •
[Features](#-features) •
[Tech Stack](#-tech-stack) •
[Architecture](#-architecture) •
[Getting Started](#-getting-started) •
[API](#-api-endpoints) •
[License](#-license)

</div>

---

## 📋 Overview

**Painel Metalgalvano** is an enterprise system built as a **capstone project (TCC)** for the Software Engineering program at Centro Universitário Católica de Santa Catarina — Joinville, Brazil.

The platform replaces manual, decentralized document workflows at **Metalgalvano** (a galvanization company based in Araquari/Joinville) with a modern, intelligent web panel.

### The Problem

| Before (manual) | After (Painel Metalgalvano) |
|---|---|
| 📄 Paper documents & scattered emails | ☁️ Everything centralized in the cloud |
| 🔍 Hard to search by project/period | 🔎 Advanced filtering & search |
| 📸 Photos lost in WhatsApp chats | 📁 Organized uploads per form field |
| 📊 Reports created manually | 📑 Auto-generated PDF reports |
| 👥 No access control | 🔐 Organization-based roles (Owner/Admin/Member/Viewer) |

---

## ✨ Features

### Core
- 🔐 **Secure authentication** — Email/password login via Firebase Auth, password recovery, and secure logout
- 📝 **Dynamic forms** — Create and fill customizable templates (Schedule, Daily Log, Checklists, Measurements, etc.) with a visual Form Builder for admins
- 📸 **Photo uploads** — Attach images per form field with Firebase Storage
- 📑 **PDF generation** — Professional reports auto-generated via PDFMake/Puppeteer
- 📊 **Analytics dashboard** — Real-time project monitoring with Recharts visualizations

### Advanced
- 🏢 **Multi-tenancy** — Multiple organizations with full data isolation (Stripe integration for subscriptions)
- 📅 **Project timeline** — Chronological view of each project's progress
- 📥 **Excel export** — Tabular data downloads via ExcelJS
- 🔔 **Notifications** — Alert system for document updates
- 🔍 **Advanced search** — Filter by project, period, manager, and document status
- 🤖 **Artificial Intelligence** — Google Gemini integration (via Genkit) for process optimization
- 🛡️ **Audit logging** — Detailed action logs retained for 90 days (IP, user-agent, entity)
- 🌐 **Internationalization** — Multi-language UI support

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 15** (App Router + Turbopack) | React framework with SSR |
| **React 18** | UI library |
| **TypeScript 5** | Static typing |
| **Tailwind CSS 3** | Utility-first styling |
| **Shadcn/UI** (Radix Primitives) | Accessible component library |
| **TanStack Query** | Data caching & synchronization |
| **React Hook Form + Zod** | Form management with validation |
| **Recharts** | Charts & data visualization |
| **Genkit (Google AI)** | Generative AI integration |
| **Lucide React** | Icon library |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js 18+** | JavaScript runtime |
| **Express.js 4** | HTTP framework |
| **TypeScript 5** | Static typing |
| **Prisma ORM 5** | Database access layer |
| **PostgreSQL 15** | Relational database |
| **Firebase Admin SDK** | Server-side auth & storage |
| **PDFMake + Puppeteer** | PDF report generation |
| **ExcelJS** | Spreadsheet export |
| **Stripe** | Payments & subscriptions |
| **Winston** | Structured logging |
| **Zod** | Schema validation |
| **Helmet + CORS + Rate Limit** | HTTP security |

### DevOps & Quality
| Technology | Purpose |
|---|---|
| **Docker + Docker Compose** | Containerization |
| **GitHub Actions** | CI/CD to GCP |
| **SonarCloud** | Static code analysis |
| **Jest + Testing Library** | Unit & integration tests |
| **Netlify** | Frontend hosting |
| **Render / GCP Cloud Run** | Backend hosting |

---

## 🏛 Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                        │
│                                                                  │
│   Next.js 15 (SSR)  ◄──►  TanStack Query  ◄──►  React 18 UI    │
│   Tailwind + Shadcn/UI         │                Recharts         │
└────────────────────────────────┼─────────────────────────────────┘
                                 │ HTTPS
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                       REST API (Express.js)                      │
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
   │              │    │                  │    │ (Photos)       │
   └─────────────┘    └──────────────────┘    └────────────────┘
```

### Data Model (main entities)

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

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.0.0
- **npm** ≥ 9.0.0
- **PostgreSQL** 15 (or Docker)
- A configured **Firebase** project (Auth + Storage)

### 1. Clone the repository

```bash
git clone https://github.com/iomes2/painel-metalgalvano.git
cd painel-metalgalvano
```

### 2. Set up the Backend

```bash
cd backend
npm install
```

Copy the environment file and fill in your credentials:

```bash
cp .env.example .env
```

<details>
<summary>📄 Backend environment variables</summary>

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_PRIVATE_KEY` | Service account private key |
| `FIREBASE_CLIENT_EMAIL` | Service account email |
| `FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket |
| `JWT_SECRET` | JWT token secret |
| `CORS_ORIGIN` | Frontend URL (e.g. `http://localhost:3000`) |

</details>

Run the database migrations and start the server:

```bash
npx prisma migrate dev
npx prisma generate
npm run dev          # Starts at http://localhost:3001
```

### 3. Set up the Frontend

```bash
cd ../frontend
npm install
```

```bash
cp .env.example .env.local
```

<details>
<summary>📄 Frontend environment variables</summary>

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID |
| `NEXT_PUBLIC_API_URL` | API URL (e.g. `http://localhost:3001`) |
| `NEXT_PUBLIC_USE_BACKEND` | `true` to use the real API |

</details>

```bash
npm run dev          # Starts at http://localhost:3000
```

### 4. Using Docker (alternative)

Prefer to spin everything up with Docker Compose:

```bash
cd backend
docker compose up -d    # PostgreSQL + Backend + Prisma Studio
```

**Prisma Studio** will be available at `http://localhost:5555` to visually explore the database.

---

## 🔌 API Endpoints

The REST API follows the `/api/v1` pattern, authenticated via Firebase ID Token in the `Authorization: Bearer <token>` header.

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/v1/forms` | Create a form |
| `GET` | `/api/v1/forms` | List forms |
| `GET` | `/api/v1/forms/:id` | Get form details |
| `PUT` | `/api/v1/forms/:id` | Update a form |
| `POST` | `/api/v1/forms/:id/photos` | Upload photos |
| `GET` | `/api/v1/forms/:id/pdf` | Generate/download PDF |
| `GET` | `/api/v1/documents` | List documents |
| `GET` | `/api/v1/stats` | Dashboard statistics |
| `GET` | `/api/v1/timeline` | Activity timeline |
| `GET` | `/api/v1/ordens-servico` | Work orders |
| `POST` | `/api/v1/form-templates` | Create form template |
| `GET` | `/api/v1/organizations` | User organizations |
| `GET` | `/api/v1/notifications` | Notifications |
| `GET` | `/api/v1/export` | Export data (Excel) |

---

## 📂 Project Structure

```
painel-metalgalvano/
├── frontend/                    # Next.js 15 (App Router)
│   ├── src/
│   │   ├── app/                 # Routes (login, dashboard, admin, lobby)
│   │   ├── components/          # React components organized by domain
│   │   │   ├── auth/            # Authentication
│   │   │   ├── dashboard/       # Main panel
│   │   │   ├── forms/           # Dynamic forms
│   │   │   ├── layout/          # Navbar, Sidebar, Footer
│   │   │   ├── reports/         # Reports & PDFs
│   │   │   ├── search/          # Advanced search
│   │   │   ├── timeline/        # Project timeline
│   │   │   └── ui/              # Shadcn/UI primitives
│   │   ├── ai/                  # Genkit (Google Gemini) flows
│   │   ├── contexts/            # React Contexts (Organization)
│   │   ├── hooks/               # Custom hooks
│   │   ├── lib/                 # Utilities & config
│   │   └── types/               # TypeScript types
│   └── public/                  # Static assets
│
├── backend/                     # Express.js + Prisma
│   ├── src/
│   │   ├── controllers/         # Route handlers
│   │   ├── services/            # Business logic
│   │   ├── middleware/          # Auth, validation, rate-limit
│   │   ├── routes/              # Route definitions
│   │   ├── validators/          # Validation schemas (Zod)
│   │   ├── utils/               # Helpers
│   │   └── tests/               # Unit tests
│   ├── prisma/
│   │   ├── schema.prisma        # Database model
│   │   ├── migrations/          # Migration history
│   │   └── seed.ts              # Seed data
│   └── docker-compose.yml       # PostgreSQL + Backend + Prisma Studio
│
├── docs/                        # Technical documentation
│   ├── ARCHITECTURE_C4.md       # C4 diagrams
│   ├── FUNCTIONAL_REQUIREMENTS.md
│   ├── USER_STORIES.md
│   ├── deployment_guide.md
│   └── GCP_SETUP_QUICKSTART.md
│
├── .github/workflows/           # CI/CD (GitHub Actions → GCP)
├── sonar-project.properties     # SonarCloud configuration
└── netlify.toml                 # Frontend deploy (Netlify)
```

---

## 🔒 Security

| Layer | Implementation |
|---|---|
| **Authentication** | Firebase Auth (email/password, recovery, 2FA) |
| **Authorization** | Organization-level RBAC (Owner → Admin → Member → Viewer) |
| **API** | Helmet, configured CORS, Rate Limiting |
| **Data** | Prisma (SQL injection prevention), Zod validation |
| **Storage** | Temporary token-signed URLs on Firebase Storage |
| **Compliance** | LGPD compliant, 90-day audit logs |

---

## 🧪 Testing

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

## 📚 Additional Documentation

| Document | Contents |
|---|---|
| [`docs/ARCHITECTURE_C4.md`](./docs/ARCHITECTURE_C4.md) | C4 Diagrams (Context, Containers, Components) |
| [`docs/FUNCTIONAL_REQUIREMENTS.md`](./docs/FUNCTIONAL_REQUIREMENTS.md) | Detailed functional requirements |
| [`docs/USER_STORIES.md`](./docs/USER_STORIES.md) | User stories |
| [`docs/deployment_guide.md`](./docs/deployment_guide.md) | Deployment guide |
| [`docs/GCP_SETUP_QUICKSTART.md`](./docs/GCP_SETUP_QUICKSTART.md) | Google Cloud setup |
| [`backend/README.md`](./backend/README.md) | Backend-specific documentation |

---

## 👨‍💻 Author

**Renan Iomes**
Software Engineering — Centro Universitário Católica de Santa Catarina (Joinville, Brazil)

[![GitHub](https://img.shields.io/badge/GitHub-iomes2-181717?style=flat-square&logo=github)](https://github.com/iomes2)

---

## 📄 License

This project was developed as a university capstone project (TCC). All rights reserved.

---

<div align="center">

Built with ❤️ and ☕ in Joinville, SC, Brazil — 2025

</div>
