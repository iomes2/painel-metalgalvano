# Guia Completo de Deploy: Next.js + Node.js + PostgreSQL no Google Cloud Run

Este guia detalha o processo passo-a-passo para subir uma aplicação Fullstack (Frontend Next.js + Backend Node.js) no Google Cloud Run, com banco de dados Cloud SQL (PostgreSQL), baseado na configuração realizada para o projeto `painel-metalgalvano`.

## 1. Pré-requisitos no Google Cloud Platform (GCP)

1.  **Criar Projeto**: Crie um novo projeto no GCP.
2.  **Ativar APIs**:
    *   Cloud Run API
    *   Artifact Registry API
    *   Cloud SQL Admin API
    *   Cloud Build API (opcional, mas recomendado)
3.  **Criar Repositórios no Artifact Registry**:
    *   Crie dois repositórios Docker: um para o frontend (ex: `painel-frontend`) e um para o backend (ex: `painel-backend`).
    *   Região: `us-central1` (ou a de sua preferência).
4.  **Criar Banco de Dados (Cloud SQL)**:
    *   Crie uma instância PostgreSQL.
    *   Crie um banco de dados e um usuário.
    *   **Importante**: Anote o "Nome da conexão da instância" (ex: `projeto:regiao:instancia`).
5.  **Criar Service Account (IAM)**:
    *   Crie uma conta de serviço para o GitHub Actions (ex: `github-actions-deploy`).
    *   **Permissões necessárias**:
        *   Cloud Run Admin
        *   Service Account User
        *   Artifact Registry Writer
        *   Cloud SQL Client
        *   Storage Admin (se usar Firebase/Storage)
    *   **Gerar Chave JSON**: Crie e baixe uma chave JSON para essa conta.

## 2. Configuração do Repositório (GitHub Secrets)

Vá em **Settings > Secrets and variables > Actions** e adicione:

### Credenciais e Configuração GCP
*   `GCP_PROJECT`: ID do projeto no Google Cloud.
*   `GCP_SA_KEY`: Conteúdo **completo** do arquivo JSON da chave da Service Account.
*   `GCP_REGION`: `us-central1` (ou a que escolheu).
*   `ARTIFACT_REGISTRY_HOST`: `us-central1-docker.pkg.dev`.
*   `GCP_FRONTEND_REPOSITORY`: Nome do repo do frontend no Artifact Registry.
*   `GCP_BACKEND_REPOSITORY`: Nome do repo do backend no Artifact Registry.

### Banco de Dados
*   `DATABASE_URL`: String de conexão (ex: `postgresql://user:pass@host:5432/db`).
    *   *Nota*: Para o Cloud Run, a conexão via socket é injetada automaticamente, mas o Prisma precisa dessa URL para gerar o cliente.
*   `CLOUD_SQL_CONNECTION_NAME`: Nome da conexão da instância (ex: `projeto:regiao:instancia`).

### Aplicação (Frontend & Backend)
*   `NEXT_PUBLIC_API_URL`: URL final do Backend no Cloud Run (ex: `https://painel-backend-xyz.a.run.app`).
    *   *Atenção*: No primeiro deploy, você não terá essa URL. Coloque um placeholder e atualize depois.
*   `NEXT_PUBLIC_USE_BACKEND`: `true`.
*   `NODE_ENV`: `production`.

### Firebase (Se utilizar)
*   `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, etc.
*   `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL` (para o Backend).

## 3. Preparação do Código

### Frontend (`Dockerfile`)
Crie um `Dockerfile` multi-stage otimizado para Next.js.
**Ponto Crítico**: O Next.js "cozinha" (bakes) as variáveis `NEXT_PUBLIC_` no build. Você **PRECISA** declarar `ARG` e `ENV` para cada uma delas no Dockerfile.

```dockerfile
# Exemplo resumido
FROM node:20-alpine AS builder
# ...
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
# ... (repita para todas as vars públicas)
RUN npm run build
```

### Backend (`Dockerfile`)
Dockerfile padrão para Node.js.
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Workflow do GitHub Actions (`.github/workflows/gcp-deploy.yml`)
Este arquivo orquestra tudo. Pontos essenciais:

1.  **Autenticação**: Usa `google-github-actions/auth` com a `GCP_SA_KEY`.
2.  **Build & Push**: Usa `docker/build-push-action`.
    *   No Frontend, passe as variáveis como `build-args`.
3.  **Deploy (Cloud Run)**: Usa `google-github-actions/deploy-cloudrun`.
    *   **Flags Importantes**:
        *   `--allow-unauthenticated`: Para tornar o site público.
        *   `--memory 1Gi`: Para evitar erro de memória no Next.js.
    *   **Env Vars**: Passe as variáveis de ambiente (DB, Firebase) aqui.
    *   **Cloud SQL**: Para o backend, use a flag `--set-cloudsql-instances` (ou configure via env var dependendo da action) para permitir conexão com o banco.

## 4. O Processo de Deploy (Primeira Vez)

1.  **Commit & Push**: Suba o código.
2.  **Falha Esperada (URL do Backend)**: O frontend vai subir apontando para `localhost` ou placeholder, pois você ainda não tem a URL do backend.
3.  **Pegar URL do Backend**: Vá no Cloud Run, copie a URL do serviço `painel-backend`.
4.  **Atualizar Secret**: Atualize `NEXT_PUBLIC_API_URL` no GitHub com a URL correta (https sem barra no final).
5.  **Re-run**: Rode o workflow novamente (Re-run all jobs) para reconstruir o frontend com a URL certa.

## 5. Configuração de Domínio (GoDaddy/Outros)

1.  **Cloud Run > Manage Custom Domains**: Adicione o mapeamento para o serviço `painel-frontend`.
2.  **DNS**: Adicione o registro `CNAME` ou `A` fornecido pelo Google no seu provedor de domínio.
3.  **Aguarde**: O certificado SSL é automático.

## 6. Troubleshooting Comum

*   **Erro "Forbidden"**: Faltou a flag `--allow-unauthenticated` no deploy.
*   **Erro "Connection Refused" (localhost)**: O frontend foi buildado com a URL errada. Corrija o secret e faça rebuild.
*   **Erro de Memória (Exited with code 137)**: Aumente a memória do Cloud Run para 1Gi ou 2Gi.
*   **Erro "Public directory not found"**: Verifique se a pasta `public` não está no `.gitignore`.
*   **Página "Placeholder"**: Você mapeou o domínio para o serviço errado (ex: um serviço padrão criado pelo GCP em vez do seu `painel-frontend`).
