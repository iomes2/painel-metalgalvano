# 🏗️ Guia de Implementação: Arquitetura Híbrida

**Sistema Painel Metalgalvano**  
**Autor:** Renan Iomes  
**Data:** Novembro 2025  
**Versão:** 1.0

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura Proposta](#arquitetura-proposta)
3. [Tecnologias Utilizadas](#tecnologias-utilizadas)
4. [Estrutura do Projeto](#estrutura-do-projeto)
5. [Implementação Passo a Passo](#implementação-passo-a-passo)
6. [Configuração do Backend](#configuração-do-backend)
7. [Integração Frontend-Backend](#integração-frontend-backend)
8. [Deploy na Nuvem](#deploy-na-nuvem)
9. [Segurança](#segurança)
10. [Testes](#testes)
11. [Cronograma de Migração](#cronograma-de-migração)

---

## 1. Visão Geral

### 🎯 Objetivo

Criar uma arquitetura híbrida que combina:

- **Firebase** para autenticação e armazenamento de arquivos
- **Backend Node.js** com Express.js e PostgreSQL para dados estruturados
- **Next.js** no frontend para interface do usuário

### ✅ Vantagens da Arquitetura Híbrida

| Aspecto                       | Benefício                                                  |
| ----------------------------- | ---------------------------------------------------------- |
| **Conformidade com RFC**      | ✅ Atende 100% o documento original (Express + PostgreSQL) |
| **Autenticação Simplificada** | ✅ Firebase Authentication já implementado                 |
| **Armazenamento de Arquivos** | ✅ Firebase Storage otimizado para fotos/PDFs              |
| **Dados Estruturados**        | ✅ PostgreSQL para consultas complexas e relatórios        |
| **Escalabilidade**            | ✅ Cada componente escala independentemente                |
| **Complexidade Técnica**      | ✅ Demonstra domínio de múltiplas tecnologias (TCC)        |
| **Backup e Recuperação**      | ✅ PostgreSQL com controle total de backups                |
| **Performance**               | ✅ Cache, índices e otimizações no banco relacional        |

---

## 2. Arquitetura Proposta

### 📊 Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    CAMADA DE APRESENTAÇÃO                    │
│                                                              │
│              Next.js Frontend (Vercel/Netlify)              │
│         - Pages (SSR/SSG)                                   │
│         - Components (React)                                │
│         - State Management (React Context/Zustand)          │
│         - Tailwind CSS                                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌───────────────────┐         ┌──────────────────────┐
│   Firebase        │         │   Backend API        │
│   Services        │         │   (Railway/Render)   │
│                   │         │                      │
│ - Authentication  │◄────────┤ - Express.js         │
│ - Storage (Fotos) │         │ - PostgreSQL         │
│ - Cloud Functions │         │ - Prisma ORM         │
│   (opcional)      │         │ - JWT Validation     │
└───────────────────┘         │ - Business Logic     │
                              │ - REST APIs          │
                              └──────────────────────┘
                                        │
                                        ▼
                              ┌──────────────────────┐
                              │   PostgreSQL DB      │
                              │   (Railway/Neon)     │
                              │                      │
                              │ - Users              │
                              │ - Forms              │
                              │ - Photos (metadata)  │
                              │ - Reports            │
                              │ - Audit Logs         │
                              └──────────────────────┘
```

### 🔄 Fluxo de Dados

#### **Autenticação:**

```
1. Usuário faz login → Firebase Authentication
2. Firebase retorna token JWT
3. Frontend envia token em todas requisições ao Backend
4. Backend valida token com Firebase Admin SDK
5. Backend autoriza acesso aos recursos
```

#### **Upload de Fotos:**

```
1. Usuário seleciona foto no formulário
2. Frontend faz upload direto para Firebase Storage
3. Firebase retorna URL da foto
4. Frontend envia URL + metadata para Backend API
5. Backend salva metadata no PostgreSQL
```

#### **Criação de Formulário:**

```
1. Usuário preenche formulário no Frontend
2. Frontend envia dados para Backend API (/api/forms)
3. Backend valida e salva no PostgreSQL
4. Backend retorna ID do formulário criado
5. Frontend exibe confirmação
```

#### **Geração de PDF:**

```
1. Frontend solicita PDF ao Backend (/api/forms/:id/generate-pdf)
2. Backend busca dados no PostgreSQL
3. Backend gera PDF com biblioteca (pdfmake/puppeteer)
4. Backend faz upload do PDF para Firebase Storage
5. Backend salva URL do PDF no PostgreSQL
6. Backend retorna URL para download
```

---

## 3. Tecnologias Utilizadas

### Frontend

```json
{
  "next": "^14.0.0",
  "react": "^18.2.0",
  "typescript": "^5.3.0",
  "tailwindcss": "^3.4.0",
  "firebase": "^10.7.0",
  "axios": "^1.6.0",
  "zod": "^3.22.0",
  "react-hook-form": "^7.49.0"
}
```

### Backend

```json
{
  "express": "^4.18.0",
  "prisma": "^5.7.0",
  "@prisma/client": "^5.7.0",
  "firebase-admin": "^12.0.0",
  "cors": "^2.8.5",
  "dotenv": "^16.3.0",
  "helmet": "^7.1.0",
  "express-rate-limit": "^7.1.0",
  "pdfmake": "^0.2.8",
  "puppeteer": "^21.6.0"
}
```

### DevOps

- **Git/GitHub**: Controle de versão
- **Railway/Render**: Hospedagem backend + PostgreSQL
- **Vercel**: Hospedagem frontend
- **Firebase Console**: Gerenciamento Auth + Storage
- **Prisma Studio**: Interface visual do banco

---

## 4. Estrutura do Projeto

```
painel-metalgalvano/
├── frontend/                    # Aplicação Next.js (atual)
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   │   ├── firebase.ts      # Firebase SDK
│   │   │   ├── api-client.ts    # Cliente HTTP para Backend
│   │   │   └── utils.ts
│   │   └── types/
│   ├── public/
│   ├── package.json
│   └── next.config.ts
│
├── backend/                     # Novo: API Node.js
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts      # Prisma Client
│   │   │   └── firebase.ts      # Firebase Admin SDK
│   │   ├── middleware/
│   │   │   ├── auth.ts          # Validação JWT Firebase
│   │   │   ├── errorHandler.ts
│   │   │   ├── validation.ts
│   │   │   └── rateLimit.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── forms.routes.ts
│   │   │   ├── photos.routes.ts
│   │   │   ├── reports.routes.ts
│   │   │   └── users.routes.ts
│   │   ├── controllers/
│   │   │   ├── formsController.ts
│   │   │   ├── photosController.ts
│   │   │   ├── reportsController.ts
│   │   │   └── usersController.ts
│   │   ├── services/
│   │   │   ├── formService.ts
│   │   │   ├── pdfService.ts
│   │   │   ├── photoService.ts
│   │   │   └── notificationService.ts
│   │   ├── validators/
│   │   │   └── formValidators.ts
│   │   ├── utils/
│   │   │   ├── logger.ts
│   │   │   └── helpers.ts
│   │   └── index.ts             # Entry point
│   ├── prisma/
│   │   ├── schema.prisma        # Modelagem do banco
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── railway.json / render.yaml
│
├── docs/
│   ├── requisitos-rfc.md
│   ├── arquitetura-hibrida.md   # Este documento
│   └── api-documentation.md     # Swagger/OpenAPI
│
└── README.md
```

---

## 5. Implementação Passo a Passo

### 📦 Fase 1: Setup do Backend (Dia 1-2)

#### Passo 1.1: Criar Estrutura do Backend

```bash
# Na raiz do projeto
mkdir backend
cd backend

# Inicializar projeto Node.js
npm init -y

# Instalar dependências principais
npm install express @prisma/client cors dotenv helmet express-rate-limit
npm install firebase-admin

# Instalar dependências de desenvolvimento
npm install -D typescript @types/node @types/express @types/cors
npm install -D prisma ts-node nodemon

# Instalar bibliotecas para PDF
npm install pdfmake puppeteer

# Inicializar TypeScript
npx tsc --init

# Inicializar Prisma
npx prisma init
```

#### Passo 1.2: Configurar TypeScript

```json
// backend/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### Passo 1.3: Configurar Scripts

```json
// backend/package.json
{
  "name": "painel-metalgalvano-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "prisma:seed": "ts-node prisma/seed.ts",
    "test": "jest",
    "lint": "eslint src/**/*.ts"
  }
}
```

### 🗄️ Fase 2: Modelagem do Banco de Dados (Dia 2-3)

#### Passo 2.1: Schema Prisma Completo

```prisma
// backend/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== USUÁRIOS ====================
model User {
  id           String   @id @default(uuid())
  firebaseUid  String   @unique
  email        String   @unique
  name         String?
  role         UserRole @default(MANAGER)
  isActive     Boolean  @default(true)

  // Relações
  forms        Form[]
  auditLogs    AuditLog[]

  // Timestamps
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  lastLoginAt  DateTime?

  @@map("users")
}

enum UserRole {
  ADMIN
  MANAGER
  EDITOR
  VIEWER
}

// ==================== FORMULÁRIOS ====================
model Form {
  id              String      @id @default(uuid())
  formType        String      // Ex: 'cronograma-diario-obra'
  osNumber        String      // Ordem de Serviço
  status          FormStatus  @default(DRAFT)

  // Dados do formulário (JSON)
  data            Json

  // Usuário responsável
  userId          String
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  // PDF gerado
  pdfUrl          String?
  pdfGeneratedAt  DateTime?

  // Relações
  photos          Photo[]
  linkedReports   LinkedReport[]

  // Timestamps
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  submittedAt     DateTime?
  approvedAt      DateTime?

  @@index([osNumber])
  @@index([userId, formType])
  @@index([status])
  @@index([createdAt])
  @@map("forms")
}

enum FormStatus {
  DRAFT
  SUBMITTED
  UNDER_REVIEW
  APPROVED
  REJECTED
  ARCHIVED
}

// ==================== FOTOS ====================
model Photo {
  id              String   @id @default(uuid())
  formId          String
  form            Form     @relation(fields: [formId], references: [id], onDelete: Cascade)

  // Dados do arquivo
  firebaseUrl     String   // URL no Firebase Storage
  firebasePath    String   // Caminho completo no Storage
  filename        String
  originalName    String
  mimeType        String
  size            Int      // Bytes

  // Metadados
  description     String?
  fieldId         String?  // Campo do formulário relacionado

  // Timestamps
  uploadedAt      DateTime @default(now())

  @@index([formId])
  @@map("photos")
}

// ==================== RELATÓRIOS VINCULADOS ====================
model LinkedReport {
  id              String   @id @default(uuid())

  // Formulário pai (ex: Acompanhamento)
  parentFormId    String
  parentForm      Form     @relation(fields: [parentFormId], references: [id], onDelete: Cascade)

  // Formulário filho (ex: RNC, Inspeção)
  childFormType   String
  childFormId     String?

  // Status
  isCompleted     Boolean  @default(false)

  // Timestamps
  createdAt       DateTime @default(now())

  @@index([parentFormId])
  @@map("linked_reports")
}

// ==================== LOGS DE AUDITORIA ====================
model AuditLog {
  id          String   @id @default(uuid())
  userId      String?
  user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  action      String   // Ex: 'FORM_CREATED', 'FORM_UPDATED', 'PDF_GENERATED'
  entity      String   // Ex: 'Form', 'Photo', 'User'
  entityId    String

  // Dados da ação
  details     Json?
  ipAddress   String?
  userAgent   String?

  // Timestamp
  createdAt   DateTime @default(now())

  @@index([userId])
  @@index([entity, entityId])
  @@index([createdAt])
  @@map("audit_logs")
}

// ==================== CONFIGURAÇÕES ====================
model SystemConfig {
  id          String   @id @default(uuid())
  key         String   @unique
  value       Json
  description String?

  updatedAt   DateTime @updatedAt

  @@map("system_config")
}
```

#### Passo 2.2: Criar Primeira Migration

```bash
# Gerar migration
npx prisma migrate dev --name init

# Gerar Prisma Client
npx prisma generate
```

#### Passo 2.3: Seed do Banco (Dados Iniciais)

```typescript
// backend/prisma/seed.ts
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Criar usuário admin de teste
  const admin = await prisma.user.upsert({
    where: { email: "admin@metalgalvano.com" },
    update: {},
    create: {
      firebaseUid: "firebase-admin-uid",
      email: "admin@metalgalvano.com",
      name: "Administrador",
      role: UserRole.ADMIN,
    },
  });

  console.log("✅ Usuário admin criado:", admin.email);

  // Configurações do sistema
  await prisma.systemConfig.upsert({
    where: { key: "max_photo_size_mb" },
    update: {},
    create: {
      key: "max_photo_size_mb",
      value: 10,
      description: "Tamanho máximo de foto em MB",
    },
  });

  await prisma.systemConfig.upsert({
    where: { key: "pdf_generation_enabled" },
    update: {},
    create: {
      key: "pdf_generation_enabled",
      value: true,
      description: "Habilitar geração de PDF",
    },
  });

  console.log("✅ Configurações do sistema criadas");
  console.log("🌱 Seed concluído!");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 🔧 Fase 3: Implementação do Backend (Dia 3-7)

#### Passo 3.1: Configuração Inicial

```typescript
// backend/src/config/database.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});

export default prisma;
```

```typescript
// backend/src/config/firebase.ts
import admin from "firebase-admin";

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}"
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

export const auth = admin.auth();
export const storage = admin.storage();

export default admin;
```

```typescript
// backend/src/config/env.ts
import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  firebaseServiceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
  firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  jwtSecret: process.env.JWT_SECRET || "seu-secret-aqui",
};
```

#### Passo 3.2: Middleware de Autenticação

```typescript
// backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import { auth } from "../config/firebase";
import prisma from "../config/database";

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    const token = authHeader.split("Bearer ")[1];

    // Validar token com Firebase
    const decodedToken = await auth.verifyIdToken(token);

    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(403).json({ error: "Usuário não autorizado" });
    }

    // Adicionar usuário na requisição
    req.user = {
      uid: user.id,
      email: user.email,
      role: user.role,
    };

    // Atualizar último login (assíncrono)
    prisma.user
      .update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      })
      .catch(console.error);

    next();
  } catch (error) {
    console.error("Erro na autenticação:", error);
    return res.status(401).json({ error: "Token inválido" });
  }
};

// Middleware para verificar role
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Permissão negada" });
    }
    next();
  };
};
```

#### Passo 3.3: Controllers e Services

```typescript
// backend/src/controllers/formsController.ts
import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import * as formService from "../services/formService";
import { z } from "zod";

// Schema de validação
const createFormSchema = z.object({
  formType: z.string().min(1),
  osNumber: z.string().min(1),
  data: z.record(z.any()),
});

export const createForm = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createFormSchema.parse(req.body);

    const form = await formService.createForm({
      ...validatedData,
      userId: req.user!.uid,
    });

    res.status(201).json(form);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Dados inválidos", details: error.errors });
    }
    console.error("Erro ao criar formulário:", error);
    res.status(500).json({ error: "Erro ao criar formulário" });
  }
};

export const getForms = async (req: AuthRequest, res: Response) => {
  try {
    const { osNumber, formType, status, page = 1, limit = 20 } = req.query;

    const forms = await formService.getForms({
      userId: req.user!.uid,
      osNumber: osNumber as string,
      formType: formType as string,
      status: status as string,
      page: Number(page),
      limit: Number(limit),
    });

    res.json(forms);
  } catch (error) {
    console.error("Erro ao buscar formulários:", error);
    res.status(500).json({ error: "Erro ao buscar formulários" });
  }
};

export const getFormById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const form = await formService.getFormById(id, req.user!.uid);

    if (!form) {
      return res.status(404).json({ error: "Formulário não encontrado" });
    }

    res.json(form);
  } catch (error) {
    console.error("Erro ao buscar formulário:", error);
    res.status(500).json({ error: "Erro ao buscar formulário" });
  }
};

export const updateForm = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const form = await formService.updateForm(id, req.user!.uid, updates);

    res.json(form);
  } catch (error) {
    console.error("Erro ao atualizar formulário:", error);
    res.status(500).json({ error: "Erro ao atualizar formulário" });
  }
};

export const deleteForm = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await formService.deleteForm(id, req.user!.uid);

    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar formulário:", error);
    res.status(500).json({ error: "Erro ao deletar formulário" });
  }
};

export const generatePDF = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const pdfUrl = await formService.generateFormPDF(id, req.user!.uid);

    res.json({ pdfUrl });
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    res.status(500).json({ error: "Erro ao gerar PDF" });
  }
};
```

```typescript
// backend/src/services/formService.ts
import prisma from "../config/database";
import { FormStatus } from "@prisma/client";
import * as pdfService from "./pdfService";

interface CreateFormData {
  formType: string;
  osNumber: string;
  data: Record<string, any>;
  userId: string;
}

export const createForm = async (data: CreateFormData) => {
  const form = await prisma.form.create({
    data: {
      formType: data.formType,
      osNumber: data.osNumber,
      data: data.data,
      userId: data.userId,
      status: FormStatus.DRAFT,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      photos: true,
    },
  });

  // Log de auditoria
  await prisma.auditLog.create({
    data: {
      userId: data.userId,
      action: "FORM_CREATED",
      entity: "Form",
      entityId: form.id,
      details: { formType: data.formType, osNumber: data.osNumber },
    },
  });

  return form;
};

interface GetFormsParams {
  userId: string;
  osNumber?: string;
  formType?: string;
  status?: string;
  page: number;
  limit: number;
}

export const getForms = async (params: GetFormsParams) => {
  const { userId, osNumber, formType, status, page, limit } = params;

  const where: any = { userId };

  if (osNumber) where.osNumber = { contains: osNumber, mode: "insensitive" };
  if (formType) where.formType = formType;
  if (status) where.status = status as FormStatus;

  const [forms, total] = await Promise.all([
    prisma.form.findMany({
      where,
      include: {
        photos: { select: { id: true, firebaseUrl: true, filename: true } },
        _count: { select: { photos: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.form.count({ where }),
  ]);

  return {
    forms,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getFormById = async (id: string, userId: string) => {
  return prisma.form.findFirst({
    where: { id, userId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      photos: true,
      linkedReports: true,
    },
  });
};

export const updateForm = async (
  id: string,
  userId: string,
  updates: Partial<CreateFormData>
) => {
  const form = await prisma.form.findFirst({
    where: { id, userId },
  });

  if (!form) {
    throw new Error("Formulário não encontrado");
  }

  const updatedForm = await prisma.form.update({
    where: { id },
    data: {
      ...updates,
      updatedAt: new Date(),
    },
    include: {
      photos: true,
    },
  });

  // Log de auditoria
  await prisma.auditLog.create({
    data: {
      userId,
      action: "FORM_UPDATED",
      entity: "Form",
      entityId: id,
      details: updates,
    },
  });

  return updatedForm;
};

export const deleteForm = async (id: string, userId: string) => {
  const form = await prisma.form.findFirst({
    where: { id, userId },
  });

  if (!form) {
    throw new Error("Formulário não encontrado");
  }

  await prisma.form.delete({ where: { id } });

  // Log de auditoria
  await prisma.auditLog.create({
    data: {
      userId,
      action: "FORM_DELETED",
      entity: "Form",
      entityId: id,
    },
  });
};

export const generateFormPDF = async (id: string, userId: string) => {
  const form = await getFormById(id, userId);

  if (!form) {
    throw new Error("Formulário não encontrado");
  }

  // Gerar PDF
  const pdfUrl = await pdfService.generatePDF(form);

  // Atualizar formulário com URL do PDF
  await prisma.form.update({
    where: { id },
    data: {
      pdfUrl,
      pdfGeneratedAt: new Date(),
    },
  });

  // Log de auditoria
  await prisma.auditLog.create({
    data: {
      userId,
      action: "PDF_GENERATED",
      entity: "Form",
      entityId: id,
      details: { pdfUrl },
    },
  });

  return pdfUrl;
};
```

#### Passo 3.4: Rotas

```typescript
// backend/src/routes/forms.routes.ts
import { Router } from "express";
import * as formsController from "../controllers/formsController";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

router.post("/", formsController.createForm);
router.get("/", formsController.getForms);
router.get("/:id", formsController.getFormById);
router.put("/:id", formsController.updateForm);
router.delete(
  "/:id",
  authorize("ADMIN", "MANAGER"),
  formsController.deleteForm
);
router.post("/:id/generate-pdf", formsController.generatePDF);

export default router;
```

#### Passo 3.5: Servidor Principal

```typescript
// backend/src/index.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config/env";

// Rotas
import formsRoutes from "./routes/forms.routes";
import photosRoutes from "./routes/photos.routes";
import usersRoutes from "./routes/users.routes";

const app = express();

// Middlewares globais
app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 requisições por IP
  message: "Muitas requisições, tente novamente mais tarde",
});
app.use("/api/", limiter);

// Rotas
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/forms", formsRoutes);
app.use("/api/photos", photosRoutes);
app.use("/api/users", usersRoutes);

// Error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Erro:", err);
    res.status(err.status || 500).json({
      error: err.message || "Erro interno do servidor",
    });
  }
);

// Iniciar servidor
app.listen(config.port, () => {
  console.log(`🚀 Servidor rodando na porta ${config.port}`);
  console.log(`📝 Ambiente: ${config.nodeEnv}`);
});
```

---

## 6. Configuração do Backend

### 📝 Variáveis de Ambiente

```bash
# backend/.env
NODE_ENV=development
PORT=3001

# PostgreSQL (Railway/Render fornece automaticamente)
DATABASE_URL="postgresql://user:password@host:5432/database"

# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...}'
FIREBASE_STORAGE_BUCKET="seu-projeto.appspot.com"

# CORS
CORS_ORIGIN="http://localhost:3000,https://seu-frontend.vercel.app"

# JWT (opcional - se não usar Firebase)
JWT_SECRET="seu-secret-super-seguro"
```

---

## 7. Integração Frontend-Backend

### 🔌 Cliente HTTP no Frontend

```typescript
// src/lib/api-client.ts
import axios from "axios";
import { auth } from "./firebase";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor: Adicionar token Firebase em todas requisições
apiClient.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: Tratar erros
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado - redirecionar para login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 📡 Services no Frontend

```typescript
// src/services/formService.ts
import apiClient from "@/lib/api-client";
import type { FormDefinition } from "@/config/forms";

export interface FormData {
  formType: string;
  osNumber: string;
  data: Record<string, any>;
}

export const formService = {
  // Criar formulário
  async createForm(formData: FormData) {
    const response = await apiClient.post("/forms", formData);
    return response.data;
  },

  // Listar formulários
  async getForms(params?: {
    osNumber?: string;
    formType?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get("/forms", { params });
    return response.data;
  },

  // Buscar formulário por ID
  async getFormById(id: string) {
    const response = await apiClient.get(`/forms/${id}`);
    return response.data;
  },

  // Atualizar formulário
  async updateForm(id: string, updates: Partial<FormData>) {
    const response = await apiClient.put(`/forms/${id}`, updates);
    return response.data;
  },

  // Deletar formulário
  async deleteForm(id: string) {
    await apiClient.delete(`/forms/${id}`);
  },

  // Gerar PDF
  async generatePDF(id: string) {
    const response = await apiClient.post(`/forms/${id}/generate-pdf`);
    return response.data.pdfUrl;
  },
};
```

### 🎨 Componente de Exemplo

```typescript
// src/components/forms/FormSubmit.tsx
"use client";
import { useState } from "react";
import { formService } from "@/services/formService";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function FormSubmit({ formType, osNumber, data }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Enviar para o backend
      const savedForm = await formService.createForm({
        formType,
        osNumber,
        data,
      });

      toast({
        title: "Sucesso!",
        description: "Formulário salvo com sucesso",
      });

      // Gerar PDF automaticamente
      const pdfUrl = await formService.generatePDF(savedForm.id);

      toast({
        title: "PDF Gerado!",
        description: "Clique para fazer download",
        action: (
          <a href={pdfUrl} target="_blank">
            Download
          </a>
        ),
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: "Falha ao salvar formulário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleSubmit} disabled={loading}>
      {loading ? "Salvando..." : "Salvar e Gerar PDF"}
    </Button>
  );
}
```

---

## 8. Deploy na Nuvem

### 🚂 Opção 1: Railway (Recomendada)

#### Passo 8.1: Criar Conta

1. Acesse [railway.app](https://railway.app)
2. Faça login com GitHub
3. Crie novo projeto

#### Passo 8.2: Adicionar PostgreSQL

```bash
# No dashboard Railway:
1. New → Database → PostgreSQL
2. Copiar DATABASE_URL gerada automaticamente
```

#### Passo 8.3: Deploy do Backend

```bash
# Na pasta backend/
# Criar railway.json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run prisma:generate && npm run build"
  },
  "deploy": {
    "startCommand": "npm run prisma:migrate && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}

# Deploy via CLI
npm install -g @railway/cli
railway login
railway link
railway up
```

#### Passo 8.4: Configurar Variáveis

No Railway Dashboard:

- `DATABASE_URL` (já configurado automaticamente)
- `FIREBASE_SERVICE_ACCOUNT_KEY`
- `FIREBASE_STORAGE_BUCKET`
- `CORS_ORIGIN`
- `NODE_ENV=production`

### ☁️ Opção 2: Render.com

```yaml
# render.yaml
services:
  - type: web
    name: painel-metalgalvano-api
    env: node
    region: oregon
    plan: free
    buildCommand: npm install && npm run prisma:generate && npm run build
    startCommand: npm run prisma:migrate && npm start
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: painel-db
          property: connectionString
      - key: NODE_ENV
        value: production

databases:
  - name: painel-db
    databaseName: painel_metalgalvano
    user: painel_user
    plan: free
```

### ▲ Deploy do Frontend (Vercel)

```bash
# Na raiz do projeto frontend
npm install -g vercel
vercel login
vercel

# Configurar variáveis de ambiente no dashboard Vercel:
# NEXT_PUBLIC_API_URL=https://seu-backend.railway.app/api
# NEXT_PUBLIC_FIREBASE_API_KEY=...
# (outras configs do Firebase)
```

---

## 9. Segurança

### 🔐 Checklist de Segurança

- ✅ **Autenticação**: Token JWT validado com Firebase
- ✅ **Autorização**: Roles (ADMIN, MANAGER, EDITOR, VIEWER)
- ✅ **Rate Limiting**: 100 req/15min por IP
- ✅ **CORS**: Apenas domínios autorizados
- ✅ **Helmet**: Headers de segurança HTTP
- ✅ **Validação de Entrada**: Zod schemas
- ✅ **SQL Injection**: Prisma ORM (queries parametrizadas)
- ✅ **XSS**: Sanitização de inputs
- ✅ **HTTPS**: Obrigatório em produção
- ✅ **Logs**: Auditoria de todas ações críticas
- ✅ **Secrets**: Variáveis de ambiente (nunca no código)

---

## 10. Testes

### 🧪 Testes Unitários

```typescript
// backend/tests/unit/formService.test.ts
import { createForm, getFormById } from "../../src/services/formService";
import prisma from "../../src/config/database";

jest.mock("../../src/config/database");

describe("FormService", () => {
  describe("createForm", () => {
    it("deve criar um formulário com sucesso", async () => {
      const mockForm = {
        id: "123",
        formType: "cronograma-diario-obra",
        osNumber: "OS-001",
        data: {},
        userId: "user-123",
      };

      (prisma.form.create as jest.Mock).mockResolvedValue(mockForm);

      const result = await createForm({
        formType: "cronograma-diario-obra",
        osNumber: "OS-001",
        data: {},
        userId: "user-123",
      });

      expect(result).toEqual(mockForm);
      expect(prisma.form.create).toHaveBeenCalledTimes(1);
    });
  });
});
```

### 🔗 Testes de Integração

```typescript
// backend/tests/integration/forms.test.ts
import request from "supertest";
import app from "../../src/index";

describe("Forms API", () => {
  let authToken: string;

  beforeAll(async () => {
    // Obter token de autenticação
    authToken = await getAuthToken();
  });

  describe("POST /api/forms", () => {
    it("deve criar um formulário", async () => {
      const response = await request(app)
        .post("/api/forms")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          formType: "cronograma-diario-obra",
          osNumber: "OS-001",
          data: { campo1: "valor1" },
        })
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.formType).toBe("cronograma-diario-obra");
    });
  });
});
```

---

## 11. Cronograma de Migração

### 📅 Plano de 8 Semanas

| Semana  | Foco            | Entregas                                                                      |
| ------- | --------------- | ----------------------------------------------------------------------------- |
| **1-2** | Setup Backend   | ✅ Estrutura do projeto<br>✅ Prisma + PostgreSQL<br>✅ Autenticação Firebase |
| **3-4** | APIs Core       | ✅ CRUD Formulários<br>✅ Upload de Fotos<br>✅ Integração Frontend           |
| **5-6** | Geração PDF     | ✅ Service de PDF<br>✅ Templates<br>✅ Storage Firebase                      |
| **7**   | Deploy + Testes | ✅ Railway/Render<br>✅ Testes E2E<br>✅ Validação                            |
| **8**   | Documentação    | ✅ README<br>✅ API Docs<br>✅ Diagramas                                      |

### 🎯 Marcos Críticos

- **Fim Semana 2**: Backend básico funcionando localmente
- **Fim Semana 4**: Frontend integrado com backend
- **Fim Semana 6**: Geração de PDF completa
- **Fim Semana 8**: Sistema em produção (completo)

---

## 📚 Referências

- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Railway Documentation](https://docs.railway.app/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Última Atualização:** 22/11/2025  
**Autor:** Renan Iomes  
**Contato:** renaniomes10@gmail.com
