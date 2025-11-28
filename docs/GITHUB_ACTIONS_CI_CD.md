# Guia de CI/CD com GitHub Actions (Frontend, Backend e Banco de Dados)

Este guia contém exemplos de pipelines para o repositório `painel-metalgalvano`.

## Opções de deploy (resumo)

- Frontend (Next.js):
  - Recomendado: Vercel (integração GitHub simples) — use `frontend-vercel.yml`.
  - Alternativa: Docker + GHCR e deploy via SSH para um servidor com Docker Compose (exemplo fornecido).
- Backend (Node/Express/Prisma):
  - Build multi-stage Docker, push para GHCR e deploy via SSH `docker compose pull` + `up -d`.
- Banco (PostgreSQL com Prisma):
  - Recomendo RBAC e deploy de banco gerenciado (e.g., Azure DB, RDS). Rodar `npx prisma migrate deploy` como etapa do pipeline (remota via SSH ou diretamente pelo runner, usando `DATABASE_URL`)

---

## Workflow: Frontend -> Vercel

Arquivo: `.github/workflows/frontend-vercel.yml`

- On push to `main` or `dev`:
  - Instala dependências e build
  - Chama `amondnet/vercel-action` para deploy
- Secrets necessários:
  - `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (criar no GitHub -> Settings -> Secrets)

---

## Workflow: Backend -> GHCR + SSH deploy

Arquivo: `.github/workflows/backend-ghcr-ssh.yml`

- On push to `main` or `dev`:
  - Build multi-platform Docker image (ctx: `./backend`) e push para `ghcr.io/${{github.repository_owner}}/painel-metalgalvano-backend`
  - Em seguida, via SSH, entra no servidor e executa `docker compose pull && docker compose up -d --remove-orphans` para atualizar containers
  - Opcional: executar `docker compose exec backend npx prisma migrate deploy` para aplicar migrations
- Secrets necessários no GitHub:
  - `GITHUB_TOKEN` (já provido pelo Actions, ou use um PAT se necessário)
  - `SSH_PRIVATE_KEY`, `DEPLOY_HOST`, `DEPLOY_USER`, `SSH_PORT` (ou 22)

Observações:

- O servidor deve ter `docker` e `docker compose` instalados e configurado para usar imagens do GHCR (se privado, configure `.docker/config.json` com PAT).
- Recomendo criar uma pasta `/home/${DEPLOY_USER}/deploy/painel-metalgalvano` contendo `docker-compose.yml` que referencie sua imagem do GHCR (ou usar `image: ghcr.io/owner/repo:tag`).

---

## Workflow: Prisma Migrations

Arquivo: `.github/workflows/prisma-migrate.yml`

- Estratégias:
  1. Rodar migrations via SSH no servidor depois do deploy (recomendado):
     - Usa `appleboy/ssh-action` para executar `docker compose exec -T backend npx prisma migrate deploy`
     - Garante que o código em produção e o Prisma Client estão sincronizados.
  2. Rodar migrations no runner do Actions:
     - Instala `node` e dependencies no `backend` e executa `npx prisma migrate deploy` com `DATABASE_URL` (secret)
- Secrets necessários:
  - `DATABASE_URL` (se for rodar no runner)
  - SSH secrets (se for executar via SSH)

---

## -> Configurar o servidor para pull das imagens privadas (GHCR)

1. Se for usar GHCR com imagens privadas, crie um PAT com escopo `write:packages, read:packages`.
2. No servidor, configure `docker login ghcr.io` com as credenciais (ou utilizar login via read-only PAT em `/etc/docker/daemon.json` um token de serviço).
3. Opcional: instanciar um script que faça `docker compose pull` e `docker compose up -d` automaticamente ao executar o deploy (o workflow SSH dá essa função).

---

## Segredos (exemplos)

- `GITHUB_TOKEN` (default)
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- `DEPLOY_HOST`, `DEPLOY_USER`, `SSH_PRIVATE_KEY`, `SSH_PORT`
- `DATABASE_URL` (caso use runner)
- `GHCR_PAT` (se preferir PAT para GHCR ao invés de GITHUB_TOKEN)
- `AZURE_CREDENTIALS` (se for usar Azure; ver ação `azure/login`)

---

## Dicas e boas práticas

- Separar deploy e migrations em etapas explícitas garante que as migrations falhem com segurança se algo estiver errado.
- Sempre faça backup do banco antes de aplicar migrations em produção.
- Mantenha `NODE_ENV` e `DATABASE_URL` como variáveis de ambiente do servidor (no cloud provider ou via docker-compose secrets).
- Para deploy em provedores como Azure, use `azure/webapps-deploy` e `azure/login` (precisa de `AZURE_CREDENTIALS`).

---

Se quiser, eu posso:

- Gerar um `docker-compose.production.yml` no repositório com imagens do GHCR e `depends_on` simplificado
- Gerar models de workflows para Azure (App Service + Azure DB for PostgreSQL)
- Fazer PR com os templates e ajustar as configurações conforme preferência

Me diga qual provedor você prefere (Vercel / Azure / Docker host com SSH), e eu adapto os exemplos pra você 🙂
