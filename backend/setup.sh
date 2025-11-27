#!/bin/bash

# Script de setup rápido do backend
# Execute: bash setup.sh

echo "🚀 Setup Backend Painel Metalgalvano"
echo "===================================="
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js >= 18.0.0"
    exit 1
fi

echo "✅ Node.js $(node -v) encontrado"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado"
    exit 1
fi

echo "✅ npm $(npm -v) encontrado"
echo ""

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências"
    exit 1
fi

echo "✅ Dependências instaladas"
echo ""

# Verificar .env
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cp .env.example .env
    echo "⚠️  IMPORTANTE: Edite o arquivo .env com suas credenciais!"
    echo "   - DATABASE_URL"
    echo "   - FIREBASE_PROJECT_ID"
    echo "   - FIREBASE_PRIVATE_KEY"
    echo "   - FIREBASE_CLIENT_EMAIL"
    echo ""
else
    echo "✅ Arquivo .env já existe"
fi

# Gerar Prisma Client
echo "🔧 Gerando Prisma Client..."
npm run prisma:generate

if [ $? -ne 0 ]; then
    echo "❌ Erro ao gerar Prisma Client"
    exit 1
fi

echo "✅ Prisma Client gerado"
echo ""

# Perguntar se quer rodar migrations
read -p "🗄️  Deseja rodar migrations do Prisma? (s/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "🔧 Rodando migrations..."
    npm run prisma:migrate
    
    if [ $? -eq 0 ]; then
        echo "✅ Migrations executadas"
        
        # Perguntar se quer fazer seed
        read -p "🌱 Deseja popular o banco com dados iniciais? (s/n) " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Ss]$ ]]; then
            npm run prisma:seed
            echo "✅ Seed executado"
        fi
    else
        echo "❌ Erro ao rodar migrations"
        echo "   Verifique se o PostgreSQL está rodando e o DATABASE_URL está correto"
    fi
fi

echo ""
echo "✨ Setup concluído!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Edite o arquivo .env com suas credenciais"
echo "   2. Execute: npm run dev"
echo "   3. Acesse: http://localhost:3001"
echo ""
echo "📚 Documentação: README.md"
echo "📝 Próximos passos: PROXIMOS_PASSOS.md"
echo ""
