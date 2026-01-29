# Multi-stage build for Next.js with pnpm

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma Client here so it's available in node_modules
RUN pnpm exec prisma generate

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy dependencies from deps stage (includes generated Prisma client)
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept build arguments from docker-compose
ARG SESSION_PASSWORD
ARG HASH_ENCRYPTION_KEY
ARG ADMIN_PASSWORD_HASH_ENCRYPTED
ARG ADMIN_EMAIL
ARG DATABASE_URL
ARG NEXTAUTH_SECRET
ARG ENCRYPTION_KEY

# Set as environment variables for the build
ENV SESSION_PASSWORD=$SESSION_PASSWORD
ENV HASH_ENCRYPTION_KEY=$HASH_ENCRYPTION_KEY
ENV ADMIN_PASSWORD_HASH_ENCRYPTED=$ADMIN_PASSWORD_HASH_ENCRYPTED
ENV ADMIN_EMAIL=$ADMIN_EMAIL
ENV DATABASE_URL=$DATABASE_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV ENCRYPTION_KEY=$ENCRYPTION_KEY

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma files
COPY --from=builder /app/prisma ./prisma

# Copy the Prisma client from deps - with pnpm it's stored in .pnpm store
COPY --from=deps /app/node_modules/.pnpm ./node_modules/.pnpm
COPY --from=deps /app/node_modules/@prisma ./node_modules/@prisma

# Copy startup script
COPY docker-entrypoint.sh ./
RUN chmod +x ./docker-entrypoint.sh && chown nextjs:nodejs ./docker-entrypoint.sh

# Create uploads directory with proper permissions
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]