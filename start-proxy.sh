#!/bin/bash
echo "Iniciando Cloud SQL Proxy..."
echo "Conectando a: metalgalvano-88706:us-central1:painel-sql"
./cloud-sql-proxy.exe --address 0.0.0.0 --port 5432 metalgalvano-88706:us-central1:painel-sql
