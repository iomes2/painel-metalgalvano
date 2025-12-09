# Backend API - Painel Metalgalvano

Backend Node.js com Express, PostgreSQL e Firebase para o sistema Painel Metalgalvano.

## 🏗️ Arquitetura Híbrida

- **Express.js** - Framework web
- **PostgreSQL** - Banco de dados relacional (via Prisma ORM)
- **Firebase Admin SDK** - Autenticação e Storage
- **TypeScript** - Tipagem estática

## 📋 Pré-requisitos

- Node.js >= 18.0.0
- PostgreSQL >= 14
- Conta Firebase com projeto configurado
- npm ou yarn

## 🚀 Setup Inicial

### 🐳 Opção 1: Docker (Recomendado)

**Mais fácil e rápido!** PostgreSQL incluído, sem configuração manual.

```bash
cd backend

# Windows
docker-start.bat

# Linux/Mac
chmod +x docker-start.sh
./docker-start.sh
```

✅ Pronto! Acesse:

- Backend: http://localhost:3001
- Prisma Studio: http://localhost:5555

📖 Ver guia completo: [DOCKER_GUIDE.md](./DOCKER_GUIDE.md)

---

### 💻 Opção 2: Instalação Local

#### 1. Instalar Dependências

```bash
cd backend
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
# Servidor
NODE_ENV=development
PORT=3001
API_VERSION=v1

# Database PostgreSQL
DATABASE_URL="postgresql://usuario:senha@localhost:5432/metalgalvano?schema=public"

# Firebase Admin SDK
FIREBASE_PROJECT_ID=seu-projeto-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE_PRIVADA\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@seu-projeto.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com

# Segurança
JWT_SECRET=sua-chave-secreta-super-segura
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logs
LOG_LEVEL=info
```

#### 3. Configurar Banco de Dados

##### Opção A: Docker PostgreSQL (mais fácil)

```bash
docker run --name postgres-metalgalvano \
  -e POSTGRES_PASSWORD=metalgalvano123 \
  -e POSTGRES_DB=metalgalvano \
  -e POSTGRES_USER=metalgalvano \
  -p 5432:5432 \
  -d postgres:15-alpine
```

DATABASE_URL:

```
postgresql://metalgalvano:metalgalvano123@localhost:5432/metalgalvano
```

##### Opção B: PostgreSQL local

```bash
# Via psql
psql -U postgres
CREATE DATABASE metalgalvano;
\q
```

#### Rodar migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

#### Seed inicial (opcional):

```bash
npm run prisma:seed
```

### 4. Executar Servidor

#### Desenvolvimento:

```bash
npm run dev
```

#### Produção:

```bash
npm run build
npm start
```

O servidor estará rodando em: `http://localhost:3001`

## 📁 Estrutura do Projeto

```
backend/
├── src/
│   ├── config/           # Configurações (Firebase, Database)
│   ├── controllers/      # Controllers das rotas
│   ├── middleware/       # Middlewares (auth, validation, error)
│   ├── routes/           # Definição de rotas
│   ├── services/         # Lógica de negócio
│   ├── utils/            # Utilitários
│   ├── validators/       # Schemas de validação (Zod)
│   └── index.ts          # Entry point
├── prisma/
│   ├── schema.prisma     # Schema do banco
│   ├── seed.ts           # Dados iniciais
│   └── migrations/       # Migrations
├── tests/                # Testes
├── .env.example          # Exemplo de variáveis
├── package.json
└── tsconfig.json
```

## 🔑 Endpoints Principais

### Health Check

```
GET /health
```

### Autenticação

Todas as rotas protegidas requerem header:

```
Authorization: Bearer <firebase-token>
```

### Forms

```
GET    /api/v1/forms           # Listar formulários
POST   /api/v1/forms           # Criar formulário
GET    /api/v1/forms/:id       # Buscar formulário
PUT    /api/v1/forms/:id       # Atualizar formulário
DELETE /api/v1/forms/:id       # Deletar formulário
POST   /api/v1/forms/:id/submit  # Submeter para revisão
POST   /api/v1/forms/:id/approve # Aprovar formulário
```

### Users

```
GET /api/v1/users/me      # Dados do usuário autenticado
GET /api/v1/users/:id     # Dados de um usuário
```

## 🗄️ Prisma Commands

```bash
# Gerar Prisma Client
npm run prisma:generate

# Criar migration
npm run prisma:migrate

# Deploy migrations (produção)
npm run prisma:migrate:deploy

# Abrir Prisma Studio (GUI)
npm run prisma:studio

# Seed do banco
npm run prisma:seed
```

## 🧪 Testes

```bash
# Rodar todos os testes
npm test

# Testes em watch mode
npm run test:watch
```

## 🔒 Segurança

O backend implementa:

- ✅ Helmet.js para headers de segurança
- ✅ CORS configurável
- ✅ Rate limiting
- ✅ Validação de entrada com Zod
- ✅ Sanitização de dados
- ✅ Autenticação Firebase JWT
- ✅ Autorização por roles

## 🌍 Deploy

### Railway

1. Criar novo projeto no Railway
2. Adicionar PostgreSQL ao projeto
3. Configurar variáveis de ambiente
4. Conectar repositório Git
5. Railway fará deploy automático

### Render

### Google Cloud (Cloud Run)

1. Siga o guia rapido: `docs/GCP_SETUP_QUICKSTART.md` para criar as infra necessárias.
2. Configure os secrets no GitHub: `GCP_SA_KEY`, `GCP_PROJECT`, `GCP_REGION`, `GCP_BACKEND_REPOSITORY`, `ARTIFACT_REGISTRY_HOST`, `DATABASE_URL`, `CLOUD_SQL_CONNECTION_NAME`, `FIREBASE_*`.
3. O repositório já inclui um workflow em: `.github/workflows/gcp-deploy.yml` que constrói, publica no Artifact Registry e faz deploy para Cloud Run. Ele também inclui um job opcional para rodar migrations via Cloud Run Job.

Se quiser que eu atualize o workflow para usar Workload Identity Federation (sem chaves JSON), me avise e eu gero um PR com as etapas e política de IAM.

### Scripts de Ajuda

O diretório `backend/scripts` inclui um exemplo `gcloud_create_resources.sh` que cria recursos básicos (Artifact Registry, service account, roles e Cloud SQL) — revise antes de executar.

1. Criar Web Service no Render
2. Adicionar PostgreSQL (ou usar externo)
3. Configurar variáveis de ambiente
4. Definir build command: `npm install && npm run build && npm run prisma:migrate:deploy`
5. Definir start command: `npm start`

## 📝 Logs

Logs são gerados usando Winston:

- Console (desenvolvimento)
- Arquivos em `/logs` (produção)
  - `error.log` - Apenas erros
  - `combined.log` - Todos os logs

## 🐛 Troubleshooting

### Erro de conexão com PostgreSQL

Verifique se o DATABASE_URL está correto e o PostgreSQL está rodando.

### Erro Firebase Admin SDK

Certifique-se de que a chave privada está corretamente formatada no `.env` (com `\n` para quebras de linha).

### Erro Prisma Client

Execute `npm run prisma:generate` após qualquer mudança no schema.

## 📚 Documentação Adicional

- [Documentação Prisma](https://www.prisma.io/docs)
- [Express.js](https://expressjs.com/)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Arquitetura Híbrida](../painel-metalgalvano/docs/arquitetura-hibrida.md)

## 👨‍💻 Desenvolvimento

Para contribuir:

1. Clone o repositório
2. Crie uma branch para sua feature
3. Faça commit das mudanças
4. Abra um Pull Request

## 📄 Licença

ISC - Renan Iomes © 2025

<!-- Trigger deploy: v0.0.2 -->
