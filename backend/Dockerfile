# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Dependências essenciais para Prisma e Node em Alpine
RUN apk add --no-cache \
    openssl \
    openssl-dev \
    libc6-compat \
    libstdc++ \
    bash

# Copiar dependências antes do resto (cache melhor)
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

RUN npm install --legacy-peer-deps --no-audit --no-fund

RUN npx prisma generate

COPY . .

RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache \
    openssl \
    openssl-dev \
    libc6-compat \
    libstdc++ \
    bash \
    postgresql-libs

# Copiar package.json
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Instalar apenas prod deps
RUN npm install --omit=dev --legacy-peer-deps --no-audit --no-fund

# Copiar tudo da build stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 8080

CMD ["npm", "start"]
