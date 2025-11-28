# Frontend Dockerfile (Next.js)
# Multi-stage build: build static Next.js app and run production server

FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache bash
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps --no-audit --no-fund

FROM node:20-alpine AS builder
WORKDIR /app

# Build args for build-time NEXT_PUBLIC_* variables. These will be used by Next.js at build time
ARG NEXT_PUBLIC_API_URL
ARG NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NODE_ENV=${NODE_ENV}

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache tini
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
EXPOSE 3000
ENV PORT=3000
CMD ["npm", "run", "start"]

# Note: If you're using `next start`, replace `CMD` with `npm run start`.
