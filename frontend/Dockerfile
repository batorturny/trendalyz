# Base image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
# Skip postinstall (prisma generate) - will run in builder stage with schema available
RUN npm install --legacy-peer-deps --ignore-scripts

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app/frontend
COPY --from=deps /app/frontend/node_modules ./node_modules
COPY frontend/ ./
COPY prisma/ /app/prisma/

# Dummy package.json at monorepo root so Prisma doesn't try auto-install there
RUN echo '{"private":true}' > /app/package.json

ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma client + build Next.js
# Use local prisma binary to avoid npx auto-install issues
RUN ./node_modules/.bin/prisma generate --schema=/app/prisma/schema.prisma && npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN mkdir .next || true
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/frontend/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
