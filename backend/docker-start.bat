@echo off
REM Script para inicializar o backend com Docker no Windows

echo ========================================
echo Iniciando Backend com Docker
echo ========================================
echo.

REM Verificar Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker não encontrado. Instale o Docker Desktop:
    echo    https://www.docker.com/products/docker-desktop
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose não encontrado
    exit /b 1
)

echo ✅ Docker encontrado
echo.

REM Verificar arquivo .env
if not exist .env (
    echo 📝 Criando arquivo .env...
    copy .env.docker .env
    echo ⚠️  IMPORTANTE: Edite o arquivo .env com suas credenciais do Firebase!
    echo.
    pause
)

echo 🏗️  Construindo imagens Docker...
docker-compose build

if errorlevel 1 (
    echo ❌ Erro ao construir imagens
    exit /b 1
)

echo ✅ Imagens construídas
echo.

echo 🚀 Iniciando containers...
docker-compose up -d postgres

echo ⏳ Aguardando PostgreSQL inicializar...
timeout /t 5 /nobreak >nul

echo 🔧 Rodando migrations...
docker-compose run --rm backend npx prisma migrate dev --name init

if not errorlevel 1 (
    echo ✅ Migrations executadas
    echo.
    
    REM Seed
    set /p seed="🌱 Deseja popular o banco com dados iniciais? (s/n): "
    
    if /i "%seed%"=="s" (
        docker-compose run --rm backend npm run prisma:seed
        echo ✅ Seed executado
    )
)

echo.
echo 🚀 Iniciando todos os serviços...
docker-compose up -d

echo.
echo ✨ Setup concluído!
echo.
echo 📋 Serviços disponíveis:
echo    🔹 Backend API:     http://localhost:3001
echo    🔹 Prisma Studio:   http://localhost:5555
echo    🔹 PostgreSQL:      localhost:5432
echo.
echo 📝 Comandos úteis:
echo    Ver logs:           docker-compose logs -f
echo    Ver logs backend:   docker-compose logs -f backend
echo    Parar serviços:     docker-compose stop
echo    Parar e remover:    docker-compose down
echo    Reiniciar:          docker-compose restart
echo.

pause
