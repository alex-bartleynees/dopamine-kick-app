# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build TanStack Start app (outputs to .output/)
RUN pnpm run build

# Production image, copy only the built output
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nitro

# Copy only the production output from TanStack Start/Nitro
COPY --from=builder --chown=nitro:nodejs /app/.output ./.output

USER nitro

EXPOSE 3000

ENV PORT=3000
ENV HOST=0.0.0.0

# Run the Nitro server directly
CMD ["node", ".output/server/index.mjs"]
