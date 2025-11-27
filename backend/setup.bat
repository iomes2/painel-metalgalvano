@echo off
REM Script de setup rápido do backend para Windows
REM Execute: setup.bat

echo ========================================
echo Setup Backend Painel Metalgalvano
echo ========================================
echo.

REM Verificar Node.js
node -v >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js não encontrado. Instale Node.js ^>= 18.0.0
    exit /b 1
)

echo ✅ Node.js encontrado
node -v

REM Verificar npm
npm -v >nul 2>&1
if errorlevel 1 (
    echo ❌ npm não encontrado
    exit /b 1
)

echo ✅ npm encontrado
npm -v
echo.

REM Instalar dependências
echo 📦 Instalando dependências...
call npm install

if errorlevel 1 (
    echo ❌ Erro ao instalar dependências
    exit /b 1
)

echo ✅ Dependências instaladas
echo.

REM Verificar .env
if not exist .env (
    echo 📝 Criando arquivo .env...
    copy .env.example .env
    echo ⚠️  IMPORTANTE: Edite o arquivo .env com suas credenciais!
    echo    - DATABASE_URL
    echo    - FIREBASE_PROJECT_ID
    echo    - FIREBASE_PRIVATE_KEY
    echo    - FIREBASE_CLIENT_EMAIL
    echo.
) else (
    echo ✅ Arquivo .env já existe
)

REM Gerar Prisma Client
echo 🔧 Gerando Prisma Client...
call npm run prisma:generate

if errorlevel 1 (
    echo ❌ Erro ao gerar Prisma Client
    exit /b 1
)

echo ✅ Prisma Client gerado
echo.

REM Perguntar sobre migrations
set /p migrate="🗄️  Deseja rodar migrations do Prisma? (s/n): "

if /i "%migrate%"=="s" (
    echo 🔧 Rodando migrations...
    call npm run prisma:migrate
    
    if not errorlevel 1 (
        echo ✅ Migrations executadas
        echo.
        
        REM Perguntar sobre seed
        set /p seed="🌱 Deseja popular o banco com dados iniciais? (s/n): "
        
        if /i "%seed%"=="s" (
            call npm run prisma:seed
            echo ✅ Seed executado
        )
    ) else (
        echo ❌ Erro ao rodar migrations
        echo    Verifique se o PostgreSQL está rodando e o DATABASE_URL está correto
    )
)

echo.
echo ✨ Setup concluído!
echo.
echo 📋 Próximos passos:
echo    1. Edite o arquivo .env com suas credenciais
echo    2. Execute: npm run dev
echo    3. Acesse: http://localhost:3001
echo.
echo 📚 Documentação: README.md
echo 📝 Próximos passos: PROXIMOS_PASSOS.md
echo.

pause
