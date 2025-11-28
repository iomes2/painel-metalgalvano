++ GCP_SETUP_QUICKSTART.md

````markdown
# Quickstart: Conectar o projeto ao Google Cloud

Este guia descreve passos rápidos para conectar o repositório Painel Metalgalvano ao Google Cloud e permitir deploy via GitHub Actions para Cloud Run + Cloud SQL + Artifact Registry.

⚠️ Prerequisitos: você precisa do gcloud (Cloud SDK) instalado e permissões de Owner/Editor no projeto GCP.

## 1) Ativar APIs necessárias

```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable iamcredentials.googleapis.com
```

### Onde executar estes comandos

- `gcloud` local: execute estas linhas no seu terminal local (PowerShell, WSL, Git Bash) com o Google Cloud SDK instalado e autenticado (`gcloud auth login`).
- `Cloud Shell`: alternativa rápida — o Cloud Shell disponíveis no Console do GCP (canto superior direito) já tem `gcloud` instalado.

### Como recuperar `GCP_PROJECT` e `GCP_REGION`

- `GCP_PROJECT`: no Console do Google Cloud (https://console.cloud.google.com/), clique no dropdown do projeto (canto superior esquerdo) e copie o _Project ID_.
- `GCP_REGION`: escolha a região desejada (ex: `us-central1`, `europe-west1`) e use consistentemente ao longo dos comandos.

## 2) Criar Artifact Registry

```bash
gcloud artifacts repositories create painel-images --repository-format=docker --location=us-central1
```

## 3) Criar Cloud SQL Postgres

```bash
gcloud sql instances create painel-sql --database-version=POSTGRES_15 --cpu=1 --memory=4GiB --region=us-central1
gcloud sql users set-password postgres --instance=painel-sql --password='S3nh4F0rte!'
gcloud sql databases create metalgalvano --instance=painel-sql
```

Copiar o connection name (ex: PROJECT_ID:us-central1:painel-sql) e configure como `CLOUD_SQL_INSTANCE_CONNECTION_NAME` nas etapas do deploy.

### Onde executar e como se conectar (Cloud SQL)

- Execute estes `gcloud` comandos no terminal local (ou Cloud Shell). Garanta que o `gcloud config set project ${GCP_PROJECT}` esteja apontando para seu projeto.
- Para desenvolvimento local, você pode rodar uma instância de Postgres com Docker (ou usar o `backend/docker-compose.yml`), a Cloud SQL é para staging/prod.
- **Obter Cloud SQL connection name**:
  ```bash
  gcloud sql instances describe painel-sql --format="value(connectionName)"
  ```
- **Exemplo de `DATABASE_URL` usando socket (recomendado para Cloud Run)**:
  ```text
  postgresql://USER:PASSWORD@/DBNAME?host=/cloudsql/PROJECT_ID:REGION:INSTANCE
  ```

## 4) Service Account para CI/CD (GitHub Actions)

```bash
gcloud iam service-accounts create github-actions-deployer --display-name "GitHub Actions Deployer"
gcloud projects add-iam-policy-binding ${GCP_PROJECT} --member="serviceAccount:github-actions-deployer@${GCP_PROJECT}.iam.gserviceaccount.com" --role="roles/run.admin"
gcloud projects add-iam-policy-binding ${GCP_PROJECT} --member="serviceAccount:github-actions-deployer@${GCP_PROJECT}.iam.gserviceaccount.com" --role="roles/artifactregistry.writer"
gcloud projects add-iam-policy-binding ${GCP_PROJECT} --member="serviceAccount:github-actions-deployer@${GCP_PROJECT}.iam.gserviceaccount.com" --role="roles/cloudsql.client"
gcloud projects add-iam-policy-binding ${GCP_PROJECT} --member="serviceAccount:github-actions-deployer@${GCP_PROJECT}.iam.gserviceaccount.com" --role="roles/iam.serviceAccountUser"
```

Gerar chave JSON (se optar pelo método clássico):

```bash
gcloud iam service-accounts keys create key.json --iam-account=github-actions-deployer@${GCP_PROJECT}.iam.gserviceaccount.com
```

Adicionar o JSON como `GCP_SA_KEY` no GitHub secrets (ou, preferencialmente, configurar Workload Identity Federation para evitar o JSON).

### Onde guardar a chave JSON e como configurar no GitHub

- **NUNCA** comite a chave JSON no repositório.
- Gere localmente (`key.json`) e copie o conteúdo para o GitHub Secrets: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`.
- Nome sugerido: `GCP_SA_KEY` (todo o conteúdo do JSON como o valor do secret).

### Workload Identity Federation — alternativa segura (sem JSON)

- Em vez de usar a chave JSON, prefira criar um Workload Identity Pool e Provider para permitir que o GitHub Actions assuma uma SA sem precisar de chave.
- O `google-github-actions/auth@v1` permite autenticar via `workload_identity_provider` no workflow. Se quiser, eu posso gerar os passos para criar o pool/provider e o binding.

## 5) Configurar Secrets no GitHub

- `GCP_SA_KEY` (JSON — se usar SA key)
- `GCP_PROJECT` (ID do projeto)
- `GCP_REGION` (ex: us-central1)
- `ARTIFACT_REGISTRY_HOST` (ex: us-central1-docker.pkg.dev)
- `GCP_BACKEND_REPOSITORY` (ex: painel-images)
- `GCP_FRONTEND_REPOSITORY` (opcional)
- `DATABASE_URL` (connection string — ver nota abaixo)
- `CLOUD_SQL_CONNECTION_NAME` (ex: PROJECT_ID:us-central1:painel-sql)
- `FIREBASE_*` env vars (project id, storage bucket, etc.)
  - `FIREBASE_PROJECT_ID` = metalgalvano-88706
  - `FIREBASE_STORAGE_BUCKET` = metalgalvano-88706.firebasestorage.app
  - `FIREBASE_API_KEY` = AIzaSyBn2rlvAQ010H6rLRtXAUsxSOfel2PLwDc
  - `FIREBASE_AUTH_DOMAIN` = metalgalvano-88706.firebaseapp.com
  - `FIREBASE_MESSAGING_SENDER_ID` = 892240349469
  - `FIREBASE_APP_ID` = 1:892240349469:web:5107ce565948c69d51f9f4

### Como adicionar os secrets no GitHub (UI)

1. Abra o repositório no GitHub em `https://github.com/OWNER/REPO` (substitua `OWNER` e `REPO`).
2. Navegue até `Settings` → `Secrets and variables` → `Actions` → `New repository secret`.
3. Crie cada secret com o nome exato usado no workflow (ex: `GCP_SA_KEY`, `GCP_PROJECT`, `GCP_REGION`, `DATABASE_URL`).
4. Para `GCP_SA_KEY` cole o JSON inteiro como valor do secret.

> Nota: Secrets do GitHub são suficientes para o CI. Para produção, avalie usar Secret Manager e vincular com Cloud Run via `--update-secrets`.

Nota sobre DATABASE_URL: quando utilizando Cloud Run com `--add-cloudsql-instances` prefira usar a socket do Cloud SQL:

```text
DATABASE_URL=postgresql://USER:PASSWORD@/DBNAME?host=/cloudsql/PROJECT:REGION:INSTANCE
```

Ex.:

```text
postgresql://metalgalvano:S3nh4F0rte@/metalgalvano?host=/cloudsql/my-project:us-central1:painel-sql
```

## 6) Deploy manual com gcloud (exemplo simples)

Build e push do container no Artifact Registry:

```bash
docker build -t us-central1-docker.pkg.dev/${GCP_PROJECT}/painel-images/painel-backend:latest -f backend/Dockerfile ./backend
docker push us-central1-docker.pkg.dev/${GCP_PROJECT}/painel-images/painel-backend:latest
```

### Onde rodar `docker` e como autenticar no Artifact Registry

- Rode estes comandos no seu terminal local (ou em um CI runner como GitHub Actions).
- Antes de `docker push`, autentique com Artifact Registry:
  ```bash
  gcloud auth configure-docker ${ARTIFACT_REGISTRY_HOST} --quiet
  ```
- `ARTIFACT_REGISTRY_HOST` normalmente é `us-central1-docker.pkg.dev` (ou similar de acordo com a região).

Deploy no Cloud Run e anexar Cloud SQL instance:

```bash
gcloud run deploy painel-backend \
  --project $GCP_PROJECT \
  --region $GCP_REGION \
  --image us-central1-docker.pkg.dev/${GCP_PROJECT}/painel-images/painel-backend:latest \
  --add-cloudsql-instances=$CLOUD_SQL_CONNECTION_NAME \
  --set-env-vars NODE_ENV=production,PORT=3001,DATABASE_URL="${DATABASE_URL}" \
  --allow-unauthenticated=false
```

### Onde executar o `gcloud run deploy` e como obter a URL

- Execute `gcloud run deploy` no terminal local (ou via GitHub Actions). Garanta que o usuário conectado (`gcloud auth login`) tenha permissão para deploy.
- Pegue a URL do serviço com:
  ```bash
  gcloud run services describe painel-backend --region ${GCP_REGION} --format='value(status.address.url)'
  ```

## 7) Prisma Migrations

Opções seguras:

1. Rodar `npx prisma migrate deploy` via um Cloud Run Job usando a mesma imagem do backend (recomendado).
2. Rodar migrations no GitHub Actions com Cloud SQL Proxy (já exemplificado no workflow).

### Onde executar as migrations

- **Cloud Run Job (recomendado)**: execute `gcloud run jobs create` e `gcloud run jobs execute` localmente (ou por CI). O workflow `.github/workflows/gcp-deploy.yml` já tem um snippet que cria/replace e executa o job para `npx prisma migrate deploy`.
- **Runner/Cloud SQL Proxy**: se preferir executar as migrations direto no GitHub Runner, ative o `cloud-sql-proxy` no workflow e rode `npx prisma migrate deploy` com `DATABASE_URL` disponível. Esta opção exige mais cuidado por expor a conexão de forma temporária ao runner.

## 8) Approd for Firebase Admin SDK on Cloud Run

- Se estiver rodando no Cloud Run, preferir conectar com ADC atribuindo uma Service Account ao serviço com as roles adequadas (Storage Admin / Firebase Admin roles). Assim sua aplicação não precisa do JSON; para ambientes locais use o `FIREBASE_PRIVATE_KEY` no `.env`.

### Onde obter as credenciais do Firebase (se necessário localmente)

- No Firebase Console (https://console.firebase.google.com/), escolha o projeto e vá em `Project settings` → `Service accounts` → `Generate new private key`. Isso gera um arquivo JSON com `private_key`, `client_email` e `project_id`.
- Use estas informações no `.env` local (ex: `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PROJECT_ID`) ou suba o JSON como secret no Secret Manager/GitHub Secret.
- Em produção, prefira ADC: configure um service account no Cloud Run com as roles corretas (Storage, Firestore) e não use o JSON.

## 9) Observações adicionais

- Se quiser reduzir escopo, mantenha o Firebase para autenticação e Storage e use apenas Cloud Run e Cloud SQL. O GCP também fornece Firebase via Console.
- Considere usar Secret Manager para armazenar `DATABASE_URL` e `FIREBASE_PRIVATE_KEY` e usar `--set-secrets` ao deploy para Cloud Run, em vez de expor segredos como env.

Se quiser, eu posso:

- Gerar um PR com alterações necessárias no `README`, `backend/.env.example`, e ajustes no `firebase.ts` (já feitos).
- Adicionar comandos `gcloud` para criar os recursos e um mini script helper `scripts/gcp-setup.sh`.
- Atualizar o workflow do GitHub Actions para usar Workload Identity Federation e evitar chaves JSON.
````
