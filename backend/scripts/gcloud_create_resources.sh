#!/usr/bin/env bash
# Simple helper to create minimal GCP resources for deploying Painel Metalgalvano
# EDITAR antes de usar: defina GCP_PROJECT e GCP_REGION

set -euo pipefail

if [[ -z "${GCP_PROJECT:-}" ]]; then
  echo "GCP_PROJECT não definido. Ex: export GCP_PROJECT=my-gcp-project"
  exit 1
fi

if [[ -z "${GCP_REGION:-}" ]]; then
  echo "GCP_REGION não definido. Ex: export GCP_REGION=us-central1"
  exit 1
fi

echo "Criando Artifact Registry..."
gcloud artifacts repositories create painel-images --repository-format=docker --location=${GCP_REGION} || echo "repo já existe"

echo "Criando Service Account para GitHub Actions..."
gcloud iam service-accounts create github-actions-deployer --display-name "GitHub Actions Deployer" || echo "SA já existe"

echo "Atribuindo roles ao SA..."
gcloud projects add-iam-policy-binding ${GCP_PROJECT} --member="serviceAccount:github-actions-deployer@${GCP_PROJECT}.iam.gserviceaccount.com" --role="roles/run.admin"
gcloud projects add-iam-policy-binding ${GCP_PROJECT} --member="serviceAccount:github-actions-deployer@${GCP_PROJECT}.iam.gserviceaccount.com" --role="roles/artifactregistry.writer"
gcloud projects add-iam-policy-binding ${GCP_PROJECT} --member="serviceAccount:github-actions-deployer@${GCP_PROJECT}.iam.gserviceaccount.com" --role="roles/cloudsql.client"
gcloud projects add-iam-policy-binding ${GCP_PROJECT} --member="serviceAccount:github-actions-deployer@${GCP_PROJECT}.iam.gserviceaccount.com" --role="roles/iam.serviceAccountUser"

echo "Criando Cloud SQL Postgres (exemplo)..."
gcloud sql instances create painel-sql --database-version=POSTGRES_15 --cpu=1 --memory=4GiB --region=${GCP_REGION} || echo "Cloud SQL instance already exists or failed"

echo "** A seguir: crie password, banco, e configure o usuário via gcloud sql users set-password e gcloud sql databases create. **"
echo "** Lembre-se de configurar os Secrets no GitHub após criar os recursos. **"

echo "Pronto. Revise docs/GCP_SETUP_QUICKSTART.md para os próximos passos."
