#!/bin/bash

# Script para inicializar o backend com Docker
echo "🐳 Iniciando Backend com Docker"
echo "================================"
echo ""

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Instale o Docker Desktop:"
    echo "   https://www.docker.com/products/docker-desktop"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não encontrado"
    exit 1
fi

echo "✅ Docker encontrado"
echo ""

# Verificar arquivo .env
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cp .env.docker.example .env
    echo "⚠️  IMPORTANTE: Edite o arquivo .env com suas credenciais do Firebase!"
    echo ""
    read -p "Pressione Enter para continuar após editar o .env..."
fi

echo "🏗️  Construindo imagens Docker..."
docker-compose build

if [ $? -ne 0 ]; then
    echo "❌ Erro ao construir imagens"
    exit 1
fi

echo "✅ Imagens construídas"
echo ""

echo "🚀 Iniciando containers..."
docker-compose up -d postgres

echo "⏳ Aguardando PostgreSQL inicializar..."
sleep 5

echo "🔧 Rodando migrations..."
docker-compose run --rm backend npx prisma migrate dev --name init

if [ $? -eq 0 ]; then
    echo "✅ Migrations executadas"
    
    # Seed
    read -p "🌱 Deseja popular o banco com dados iniciais? (s/n) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        docker-compose run --rm backend npm run prisma:seed
        echo "✅ Seed executado"
    fi
fi

echo ""
echo "🚀 Iniciando todos os serviços..."
docker-compose up -d

echo ""
echo "✨ Setup concluído!"
echo ""
echo "📋 Serviços disponíveis:"
echo "   🔹 Backend API:     http://localhost:3001"
echo "   🔹 Prisma Studio:   http://localhost:5555"
echo "   🔹 PostgreSQL:      localhost:5432"
echo ""
echo "📝 Comandos úteis:"
echo "   Ver logs:           docker-compose logs -f"
echo "   Ver logs backend:   docker-compose logs -f backend"
echo "   Parar serviços:     docker-compose stop"
echo "   Parar e remover:    docker-compose down"
echo "   Reiniciar:          docker-compose restart"
echo ""
