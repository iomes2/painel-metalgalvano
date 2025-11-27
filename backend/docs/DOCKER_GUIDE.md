# 🚀 Guia Rápido - Docker

## Pré-requisitos

- **Docker Desktop** instalado: https://www.docker.com/products/docker-desktop
- Credenciais do Firebase (para autenticação)

## Inicialização Rápida (Recomendado)

### Windows

```bash
cd d:\!repositorios\metalgalvano\backend
docker-start.bat
```

### Linux/Mac

```bash
cd backend
chmod +x docker-start.sh
./docker-start.sh
```

## Ou Manualmente

### 1. Configurar variáveis de ambiente

```bash
# Copiar template
cp .env.docker .env

# Editar com suas credenciais do Firebase
notepad .env  # Windows
nano .env     # Linux/Mac
```

### 2. Iniciar serviços

```bash
# Construir imagens
docker-compose build

# Iniciar PostgreSQL
docker-compose up -d postgres

# Aguardar 5 segundos para o banco inicializar

# Rodar migrations
docker-compose run --rm backend npx prisma migrate dev --name init

# Popular banco com dados iniciais (opcional)
docker-compose run --rm backend npm run prisma:seed

# Iniciar todos os serviços
docker-compose up -d
```

## 🌐 Serviços Disponíveis

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Backend API** | http://localhost:3001 | API REST |
| **Prisma Studio** | http://localhost:5555 | Interface visual do banco |
| **PostgreSQL** | localhost:5432 | Banco de dados |

### Credenciais PostgreSQL

```
Host: localhost
Port: 5432
Database: metalgalvano
User: metalgalvano
Password: metalgalvano123
```

## 📝 Comandos Úteis

```bash
# Ver logs de todos os serviços
docker-compose logs -f

# Ver logs apenas do backend
docker-compose logs -f backend

# Ver logs apenas do PostgreSQL
docker-compose logs -f postgres

# Parar serviços (mantém dados)
docker-compose stop

# Iniciar serviços parados
docker-compose start

# Parar e remover containers (mantém dados no volume)
docker-compose down

# Parar e remover TUDO (inclusive dados)
docker-compose down -v

# Reiniciar serviços
docker-compose restart

# Reiniciar apenas o backend
docker-compose restart backend

# Reconstruir imagens
docker-compose build --no-cache

# Entrar no container do backend
docker-compose exec backend sh

# Entrar no PostgreSQL
docker-compose exec postgres psql -U metalgalvano -d metalgalvano

# Rodar comandos Prisma
docker-compose run --rm backend npx prisma studio
docker-compose run --rm backend npx prisma migrate dev
docker-compose run --rm backend npm run prisma:seed
```

## 🧪 Testar a API

### Health Check

```bash
curl http://localhost:3001/health
```

Resposta esperada:
```json
{
  "success": true,
  "message": "API está funcionando",
  "timestamp": "2025-11-22T...",
  "environment": "development"
}
```

### Criar um formulário

```bash
# 1. Obtenha o token do Firebase no frontend
# 2. Use o token na requisição:

curl -X POST http://localhost:3001/api/v1/forms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_FIREBASE" \
  -d '{
    "formType": "cronograma-diario-obra",
    "osNumber": "OS-001",
    "data": {
      "cliente": "Teste",
      "obra": "Estrutura"
    }
  }'
```

## 🔧 Desenvolvimento

### Estrutura de Containers

- **postgres**: Banco de dados PostgreSQL 15
- **backend**: API Node.js com hot-reload
- **prisma-studio**: Interface visual do Prisma (opcional)

### Hot Reload

O código é montado como volume no container, então qualquer alteração no código é refletida automaticamente sem precisar reiniciar.

### Modificar Schema Prisma

```bash
# 1. Edite prisma/schema.prisma
# 2. Crie a migration
docker-compose run --rm backend npx prisma migrate dev --name sua_migration

# 3. Reinicie o backend
docker-compose restart backend
```

## 🐛 Troubleshooting

### Porta já em uso

Se a porta 3001, 5432 ou 5555 já estiver em uso:

1. Edite `docker-compose.yml`
2. Altere o mapeamento de portas:
   ```yaml
   ports:
     - '3002:3001'  # Usar porta 3002 no host
   ```

### Erro ao conectar no PostgreSQL

```bash
# Verificar se o container está rodando
docker-compose ps

# Ver logs do PostgreSQL
docker-compose logs postgres

# Reiniciar PostgreSQL
docker-compose restart postgres
```

### Erro no Prisma Client

```bash
# Regenerar Prisma Client
docker-compose run --rm backend npx prisma generate

# Reiniciar backend
docker-compose restart backend
```

### Limpar tudo e recomeçar

```bash
# Parar e remover tudo
docker-compose down -v

# Remover imagens
docker-compose down --rmi all

# Reconstruir do zero
docker-compose build --no-cache
docker-compose up -d
```

## 🔄 Workflow de Desenvolvimento

1. **Iniciar serviços**
   ```bash
   docker-compose up -d
   ```

2. **Desenvolver** (código é atualizado automaticamente)

3. **Ver logs** em tempo real
   ```bash
   docker-compose logs -f backend
   ```

4. **Testar** usando Postman, curl ou frontend

5. **Acessar banco** via Prisma Studio
   ```
   http://localhost:5555
   ```

6. **Parar** quando terminar
   ```bash
   docker-compose stop
   ```

## 📦 Volumes

Os dados do PostgreSQL são persistidos em um volume Docker chamado `postgres_data`.

Isso significa que você pode parar e iniciar os containers sem perder dados.

Para limpar os dados:
```bash
docker-compose down -v
```

## 🚀 Deploy (Futuro)

Para produção, use o `Dockerfile` (não o `.dev`):

```bash
# Build para produção
docker build -t metalgalvano-backend .

# Rodar em produção
docker run -p 3001:3001 --env-file .env metalgalvano-backend
```

---

**Dica:** Use `docker-compose logs -f` para monitorar tudo em tempo real! 🎯
