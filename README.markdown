<div align="center">

🌐 **[Português (BR)](./README.pt-br.md)** | English

# 🏗️ Painel Metalgalvano

### Construction Site Management Panel — Software Engineering Capstone Project (TCC)

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Storage-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)

**A full-stack web application to digitize and centralize construction site document management — featuring role-based access, dynamic forms, photo uploads, automated PDF reports, project timelines, and an analytics dashboard.**

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

**Painel Metalgalvano** is an enterprise web system developed as a **capstone project (TCC)** for the Software Engineering program at Centro Universitário Católica de Santa Catarina — Joinville, Brazil.

The platform replaces manual, paper-based document workflows at **Metalgalvano** (a galvanization company in Araquari/Joinville) with a modern, centralized web panel for construction site managers.

### The Problem

| Before (manual) | After (Painel Metalgalvano) |
|---|---|
| 📄 Paper documents & scattered emails | ☁️ Everything centralized in the cloud |
| 🔍 Hard to find documents by project | 🔎 Advanced filtering & full-text search |
| 📸 Photos scattered across WhatsApp | 📁 Organized uploads per form |
| 📊 Reports filled out by hand | 📑 Auto-generated, downloadable PDF reports |
| 👥 No access control | 🔐 Role-based access (Admin / Manager / Editor / Viewer) |

---

## ✨ Features

- 🔐 **Secure authentication** — Email/password login via Firebase Auth, password recovery, session management and secure logout
- 📝 **Dynamic forms** — 14 customizable document templates (Schedule, Daily Log, Checklists, Risk Analysis, Work Permit, Non-Conformity Report, Safety Dialogue, and more) with conditional field visibility and auto-fill from linked forms
- 📸 **Photo uploads** — Image attachment per form field with Firebase Storage, gallery view and deletion
- 📑 **PDF generation** — Professional reports auto-generated via PDFMake and downloadable on demand
- 📊 **Analytics dashboard** — Real-time stats per work order (forms submitted, photos uploaded, linked reports)
- 📅 **Activity timeline** — Chronological history of submissions and updates per work order
- 🔍 **Advanced search** — Filter by work order number, form type, date range and status
- 📂 **Document library** — Central repository for company documents (PDFs, images, spreadsheets)
- 📥 **Excel export** — Download tabular data for reporting and offline analysis
- 🔔 **Notifications** — In-app alerts for form approvals, updates and relevant events
- 🛡️ **Audit logs** — Detailed action history stored for 90 days (action, entity, IP, user agent)
- 🔗 **Linked forms** — After submitting one document, the system auto-suggests and navigates to the next related form in the workflow

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
| **TanStack Query** | Data fetching, caching & synchronization |
| **React Hook Form + Zod** | Form management with runtime validation |
| **Recharts** | Charts & data visualization |
| **Lucide React** | Icon library |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js 18+** | JavaScript runtime |
| **Express.js 4** | HTTP framework |
| **TypeScript 5** | Static typing |
| **Prisma ORM 5** | Type-safe database access |
| **PostgreSQL 15** | Primary relational database |
| **Firebase Admin SDK** | Server-side auth token verification |
| **Firebase Storage** | Photo & file storage |
| **Google Cloud Firestore** | Real-time data sync (work orders) |
| **PDFMake** | PDF report generation |
| **ExcelJS** | Spreadsheet export |
| **Winston** | Structured logging |
| **Zod** | Request schema validation |
| **Helmet + CORS + Rate Limiting** | HTTP security hardening |

### DevOps & Quality
| Technology | Purpose |
|---|---|
| **Docker + Docker Compose** | Local development environment |
| **GitHub Actions** | CI/CD pipeline (build, test, deploy to GCP) |
| **GCP Cloud Run** | Backend hosting |
| **Netlify** | Frontend hosting |
| **SonarCloud** | Static code analysis & quality gate |
| **Jest + React Testing Library** | Unit & integration tests |

---

## 🏛 Architecture

The system follows a **client–server** architecture with a hybrid database strategy: PostgreSQL (via Prisma) for structured relational data, and Firebase (Auth + Storage + Firestore) for authentication, file storage, and real-time work order sync.

```
┌──────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                        │
│                                                                  │
│   Next.js 15 (SSR/App Router)  ◄──►  TanStack Query             │
│   Tailwind CSS + Shadcn/UI           React Hook Form             │
└────────────────────────────────┬─────────────────────────────────┘
                                 │ HTTPS
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                       REST API (Express.js)                      │
│                                                                  │
│   Controllers ──► Services ──► Prisma ORM ──► PostgreSQL 15     │
│        │                                                         │
│        ├── Firebase Admin SDK (Auth token verification)          │
│        ├── PDFMake (PDF generation)                              │
│        ├── ExcelJS (Excel export)                                │
│        └── Winston (Structured logging)                          │
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

### Database Model

```
User ──┬── Form ──── Photo
       │       └─── LinkedReport
       ├── AuditLog
       └── Notification
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.0.0
- **npm** ≥ 9.0.0
- **PostgreSQL** 15 (or Docker)
- A configured **Firebase** project (Auth + Storage + Firestore)

### 1. Clone the repository

```bash
git clone https://github.com/iomes2/painel-metalgalvano.git
cd painel-metalgalvano
```

### 2. Set up the Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in your credentials
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
| `CORS_ORIGIN` | Frontend URL (e.g. `http://localhost:3000`) |
| `JWT_SECRET` | JWT token secret |

</details>

```bash
npx prisma migrate dev
npx prisma generate
npm run dev          # Starts at http://localhost:3001
```

### 3. Set up the Frontend

```bash
cd ../frontend
npm install
cp .env.example .env.local   # fill in your credentials
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
| `NEXT_PUBLIC_API_URL` | Backend API URL (e.g. `http://localhost:3001`) |
| `NEXT_PUBLIC_USE_BACKEND` | Set to `true` to use the real API |

</details>

```bash
npm run dev          # Starts at http://localhost:3000
```

### 4. Using Docker (alternative)

```bash
cd backend
docker compose up -d    # Starts PostgreSQL + Backend + Prisma Studio
```

**Prisma Studio** is available at `http://localhost:5555` to browse the database visually.

---

## 🔌 API Endpoints

All routes require a Firebase ID Token via `Authorization: Bearer <token>` header.

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/v1/forms` | Submit a form |
| `GET` | `/api/v1/forms` | List forms (with filters) |
| `GET` | `/api/v1/forms/:id` | Get form details |
| `PUT` | `/api/v1/forms/:id` | Update a form |
| `DELETE` | `/api/v1/forms/:id` | Delete a form |
| `POST` | `/api/v1/forms/:id/photos` | Upload photos to a form |
| `DELETE` | `/api/v1/photos/:id` | Delete a photo |
| `GET` | `/api/v1/forms/:id/pdf` | Generate and download PDF |
| `GET` | `/api/v1/stats` | Dashboard statistics |
| `GET` | `/api/v1/timeline` | Activity timeline |
| `GET` | `/api/v1/ordens-servico` | List work orders |
| `GET` | `/api/v1/notifications` | List notifications |
| `PATCH` | `/api/v1/notifications/:id/read` | Mark notification as read |
| `GET` | `/api/v1/export` | Export data as Excel |

---

## 📂 Project Structure

```
painel-metalgalvano/
├── frontend/                    # Next.js 15 (App Router)
│   ├── src/
│   │   ├── app/                 # Routes: /login, /dashboard, /admin
│   │   │   ├── dashboard/       # Main app: forms, search, timeline, docs, monitoring
│   │   │   └── admin/           # Form builder (admin only)
│   │   ├── components/
│   │   │   ├── auth/            # Firebase auth guard & initializer
│   │   │   ├── dashboard/       # Stats cards, monitoring panel
│   │   │   ├── forms/           # Dynamic form renderer
│   │   │   ├── layout/          # Sidebar, header, user nav
│   │   │   ├── reports/         # PDF preview & report viewer
│   │   │   ├── search/          # Search & filter UI
│   │   │   ├── timeline/        # Activity timeline component
│   │   │   └── ui/              # Shadcn/UI primitives
│   │   ├── config/
│   │   │   └── forms.ts         # All form definitions (fields, types, linked triggers)
│   │   ├── hooks/               # Custom hooks (useAuth, useSessionExpiration, etc.)
│   │   └── lib/                 # API client, Firebase config, utilities
│   └── public/
│
├── backend/                     # Express.js REST API
│   ├── src/
│   │   ├── controllers/         # formsController, photosController, statsController...
│   │   ├── services/            # formService, pdfService, exportService, backupService...
│   │   ├── middleware/          # Firebase auth, error handler, rate limiter
│   │   ├── routes/              # Route definitions for all resources
│   │   ├── validators/          # Zod schemas for request validation
│   │   └── utils/               # Logger, helpers
│   ├── prisma/
│   │   ├── schema.prisma        # Data model: User, Form, Photo, LinkedReport, AuditLog...
│   │   ├── migrations/          # Migration history
│   │   └── seed.ts              # Initial data seeding
│   └── docker-compose.yml
│
├── docs/                        # Technical documentation
│   ├── ARCHITECTURE_C4.md
│   ├── FUNCTIONAL_REQUIREMENTS.md
│   ├── USER_STORIES.md
│   └── deployment_guide.md
│
└── .github/workflows/           # CI/CD: test → build → deploy to GCP Cloud Run
```

---

## 🔒 Security

| Layer | Implementation |
|---|---|
| **Authentication** | Firebase Auth — email/password, password recovery |
| **Authorization** | Role-based access control (Admin / Manager / Editor / Viewer) validated server-side |
| **API hardening** | Helmet, CORS allowlist, Express Rate Limiter |
| **Data integrity** | Prisma (prevents SQL injection), Zod validation on every route |
| **File storage** | Signed temporary URLs from Firebase Storage |
| **Audit** | Logs every action (entity, user, IP, timestamp) for 90 days |
| **Compliance** | LGPD-aware data handling |

---

## 🧪 Testing

```bash
# Backend (Jest)
cd backend && npm test

# Frontend (Jest + React Testing Library)
cd frontend && npm test
```

Code quality is enforced via **SonarCloud** on every push to `master`, with a quality gate that blocks builds on critical issues.

---

## 📚 Documentation

| File | Contents |
|---|---|
| [`docs/ARCHITECTURE_C4.md`](./docs/ARCHITECTURE_C4.md) | C4 architecture diagrams |
| [`docs/FUNCTIONAL_REQUIREMENTS.md`](./docs/FUNCTIONAL_REQUIREMENTS.md) | Full functional requirements list |
| [`docs/USER_STORIES.md`](./docs/USER_STORIES.md) | User stories |
| [`docs/deployment_guide.md`](./docs/deployment_guide.md) | Production deployment guide |
| [`backend/README.md`](./backend/README.md) | Backend-specific documentation |

---

## 👨‍💻 Author

**Renan Iomes**
Software Engineering — Centro Universitário Católica de Santa Catarina (Joinville, Brazil)
Capstone Project (TCC) — 2025

[![GitHub](https://img.shields.io/badge/GitHub-iomes2-181717?style=flat-square&logo=github)](https://github.com/iomes2)

---

## 📄 License

All rights reserved. This project was developed as a university capstone project (TCC) and is not open for commercial use by third parties.

---

<div align="center">

Built with ❤️ and ☕ in Joinville, SC, Brazil — 2025

</div>
