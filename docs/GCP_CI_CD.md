# CI/CD com Google Cloud (Cloud Run / Artifact Registry / Cloud SQL)

Este documento explica como adaptar um pipeline de AWS (Elastic Beanstalk / S3) para Google Cloud Platform (GCP). Ele complementa o arquivo `.github/workflows/gcp-deploy.yml` que foi adicionado ao repositório.

## Visão geral

- Build: Docker multi-stage para backend e frontend
- Push: Artifact Registry (repositório de imagens do GCP)
- Deploy: Cloud Run para backend e frontend (pode ser usado para Next.js com SSR)
- DB: Cloud SQL (Postgres) — migrates com `prisma migrate deploy`

---

## Passo 1: Criar Service Account e permissões

O workflow do GitHub usar um Service Account para autenticação. Crie no GCP um Service Account e anexe as seguintes roles mínimas:

- roles/run.admin (Cloud Run Admin) - deploy e job control
- roles/artifactregistry.writer - push images para Artifact Registry
- roles/iam.serviceAccountUser - (necessário para algumas operações)
- roles/cloudsql.client - se for conectar ao Cloud SQL (migrations / runtime)
- roles/storage.admin - (opcional) se usar buckets para deploy

Comandos (gcloud):

```bash
gcloud iam service-accounts create github-actions-deployer --display-name "GitHub Actions Deployer"
# Grant roles
gcloud projects add-iam-policy-binding ${GCP_PROJECT} --member "serviceAccount:github-actions-deployer@${GCP_PROJECT}.iam.gserviceaccount.com" --role "roles/run.admin"
# Add other roles as necessary
```

Depois gere uma chave JSON e coloque o conteúdo no GitHub Secret `GCP_SA_KEY`.

---

## Passo 2: Criar Artifact Registry

Artifact Registry (para Docker) — configure um repositório do tipo Docker.

```bash
gcloud artifacts repositories create painel-images --repository-format=docker --location=us-central1
```

A URL para tags será algo como: `us-central1-docker.pkg.dev/${GCP_PROJECT}/painel-images/painel-backend:TAG`

No workflow colocamos uma variável `ARTIFACT_REGISTRY_HOST` que deve ser `us-central1-docker.pkg.dev` (mude conforme sua região).

---

## Passo 3: Cloud SQL (Postgres) — opcional, mas recomendado

- Crie um banco no Cloud SQL (Postgres).
- Configure o Cloud Run para usar o Cloud SQL instance com `--add-cloudsql-instances=${INSTANCE_CONNECTION_NAME}` ao fazer deploy.
- Para migrations, temos duas opções:
  1. Rodar `npx prisma migrate deploy` de dentro de um Cloud Run Job (proposto no workflow) — mais seguro.
  2. Rodar no Runner (GitHub Action) usando Cloud SQL Proxy (mais trabalhoso).

Se usar Cloud SQL, configure `DATABASE_URL` para apontar para o banco e adicione segredos ao GitHub.

---

## Passo 4: Secrets necessários no GitHub

- `GCP_SA_KEY` - JSON do service account (credencial)
- `GCP_PROJECT` - project id
- `GCP_REGION` - ex: us-central1
- `GCP_BACKEND_REPOSITORY` - nome do repositório de imagens para backend
- `GCP_FRONTEND_REPOSITORY` - idem para frontend
- `ARTIFACT_REGISTRY_HOST` - ex: us-central1-docker.pkg.dev
- `DATABASE_URL` - string de conexão com o DB (Postgres)
- `NEXT_PUBLIC_API_URL` - URL pública do backend (ex: Cloud Run endpoint)
- `RUN_PRISMA_MIGRATIONS` - true/false (controla se o workflow deve rodar migrations automaticamente)

---

## Como funciona o deploy & migrations no pipeline

- O pipeline detecta mudanças (backend/frontend) e só roda o job correspondente
- O backend é buildado, push para Artifact Registry e deploy no Cloud Run
- Após deploy, se `RUN_PRISMA_MIGRATIONS` estiver como `true`, o workflow cria/substitui um Cloud Run Job (nome: `painel-backend-migrate`) que executa `npx prisma migrate deploy`. O job vai rodar com a mesma imagem do backend.

---

## Comandos úteis para teste local

- Build local do backend (Docker) e run:

```bash
docker build -t painel-backend:local -f backend/Dockerfile ./backend
docker run -p 3001:3001 --env-file backend/.env --rm painel-backend:local
```

- Para executar migrations localmente:

```bash
cd backend
npx prisma migrate deploy --preview-feature
```

---

## Observações finais

- Se você preferir usar o Cloud Run apenas para o backend e o Firebase Hosting (ou GCS + Cloud CDN) para o frontend, eu adapto o workflow com as etapas pra hospedar o frontend estaticamente.
- Se usar Cloud SQL com conexões públicas, configure `DATABASE_URL` de forma segura; prefira Cloud Run + Cloud SQL com `--add-cloudsql-instances`/secret manager.

Quer que eu:

- ajuste o workflow pra Cloud SQL usando `--add-cloudsql-instances`, ou
- troque o frontend para Firebase Hosting (quando for totalmente SSG), ou
- crie PRs com as mudanças para sua branch `dev`?

Escolha uma e eu adapto os arquivos e explico como gerar os secrets e permissões 🙌
