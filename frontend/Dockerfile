FROM node:20-alpine AS base

# --- Dependencies ---
FROM base AS deps
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm install --legacy-peer-deps --ignore-scripts

# --- Build ---
FROM base AS builder
WORKDIR /app/frontend

COPY --from=deps /app/frontend/node_modules ./node_modules
COPY frontend/ ./
COPY prisma/ /app/prisma/

ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma client + build Next.js
RUN npx prisma generate --schema=/app/prisma/schema.prisma
RUN npx next build

# --- Production ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/frontend/public ./public

# Prisma for runtime migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/frontend/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/frontend/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/frontend/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy --schema ./prisma/schema.prisma 2>&1; node server.js"]
